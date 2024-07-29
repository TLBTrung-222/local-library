const asyncHandler = require('express-async-handler');
const passport = require('passport');
const User = require('../models/user');
const { body, validationResult } = require('express-validator');

// Display login form on GET.
exports.login_get = [
    isAlreadyLogin,

    function (req, res, next) {
        // get the error message from 'auth' or success message from 'register' (if exist)
        const messages = extractFlashMessages(req);

        res.render('user_login', {
            title: 'Login',
            errors: messages.length > 0 ? messages : null,
        });
    },
];

exports.login_post = [
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login', // if login fail, redirect to login Again but with error flash
        failureFlash: true,
    }),
];

exports.register_get = (req, res) => {
    return res.render('user_form', {
        title: 'Create user',
    });
};

exports.register_post = [
    body('username', 'Username must be at least 3 characters long.')
        .isLength({ min: 3 })
        .isAlphanumeric()
        .withMessage('User name contains non-alphanumeric character')
        .trim(),
    body('fullname', 'Full name must be at least 3 characters long.')
        .isLength({ min: 3 })
        .trim(),
    body('email', 'Please enter a valid email address.').isEmail().trim(),
    body('password', 'Password must be between 4-32 characters long.')
        .isLength({ min: 4, max: 32 })
        .trim(),
    body(
        'passwordConfirm',
        'Password confirm must be between 4-32 characters long.'
    )
        .isLength({ min: 4, max: 32 })
        .trim(),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        const errorsArray = errors.array();

        // make sure password confirm is matched
        if (req.body.passwordConfirm !== req.body.password) {
            errorsArray.push({ msg: 'Confirm password wrong' });
        }
        // check if user exist yet
        const userExist = await User.findOne({
            username: req.body.username,
        }).exec();

        // username already exist, return 409 Conflict
        if (userExist) {
            errorsArray.push({ msg: 'User already exist' });
        }
        // render again if any error occur
        if (errorsArray.length > 0) {
            return res.status(400).render('user_form', {
                title: 'Create User',
                errors: errorsArray,
                userExist: userExist,
            });
        }

        // user's submission is valid, save user
        const newUser = new User({
            username: req.body.username,
            fullname: req.body.fullname,
            email: req.body.email,
            role: req.body.role,
        });

        newUser.setPassword(req.body.password);
        await newUser.save();
        // resource created, return 201 Created
        req.flash('success', 'Successfully registered. You can log in now!');
        res.redirect('/users/login');
    }),
];

exports.profile = (req, res, next) => {
    // after authenticated, req.user contains object from deserializeUser
    const messages = req.flash('success'); // load flash message from update user

    res.render('user_profile', { user: req.user, messages: messages });
};

exports.update_get = (req, res, next) => {
    res.render('user_form', { userExist: req.user });
};

exports.update_post = [
    body('username', 'Username must be at least 3 characters long.')
        .isLength({ min: 3 })
        .isAlphanumeric()
        .withMessage('User name contains non-alphanumeric character')
        .trim(),
    body('fullname', 'Full name must be at least 3 characters long.')
        .isLength({ min: 3 })
        .trim(),
    body('email', 'Please enter a valid email address.').isEmail().trim(),
    body('password', 'Password must be between 4-32 characters long.')
        .isLength({ min: 4, max: 32 })
        .trim(),
    body(
        'passwordConfirm',
        'Password confirm must be between 4-32 characters long.'
    )
        .isLength({ min: 4, max: 32 })
        .trim(),
    body('role', 'Role must be a number').isInt({ min: 0, max: 2 }),
    authorizeUserUpdate,
    asyncHandler(async (req, res, next) => {
        // get the information submitted, need to validated
        const errors = validationResult(req);

        // if user change they username, make sure it have not existed yet
        if (req.body.username !== req.user.username) {
            // make sure username is not existed yet
            const userExist = await User.findOne({
                username: req.body.username,
            }).exec();

            if (userExist) {
                // inform user this username is existed
                res.status(409).render('user_form', {
                    title: 'User already existed',
                    userExist: userExist,
                });
            }
        }

        if (!errors.isEmpty()) {
            res.render('user_form', {
                errors: errors.array(),
            });
        }

        // make sure password confirm is matched
        if (req.body.passwordConfirm !== req.body.password) {
            return res.status(400).render('user_form', {
                title: 'Confirm password wrong',
            });
        }
        // find user and update manually
        const updatedUser = await User.findOne({
            username: req.body.username,
        }).exec();

        updatedUser.username = req.body.username;
        updatedUser.fullname = req.body.fullname;
        updatedUser.email = req.body.email;
        updatedUser.role = req.body.role;
        updatedUser.setPassword(req.body.password);
        await updatedUser.save();

        req.flash('success', 'Update user succesfully');
        res.redirect(updatedUser.url); // back to profile page
    }),
];

// get request on logout
exports.log_out = (req, res, next) => {
    req.logOut(function (err) {
        if (err) {
            return next(err);
        }
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/');
        });
    });
};

//_ ----------- Helper functions --------------------------------------------

// if user already log in, redirect user to home page
function isAlreadyLogin(req, res, next) {
    if (req.user && req.isAuthenticated()) {
        return res.redirect('/');
    } else return next();
}

// make sure user interacting with his profile page (prevent stealing userId)
function authorizeUserUpdate(req, res, next) {
    if (req.user._id.toString() !== req.params.id) {
        res.status(403);
        return next(Error('Fobidden request'));
    } else return next();
}

// Extract flash messages from req.flash and return an array of messages.
function extractFlashMessages(req) {
    var messages = [];
    // Check if flash messages was sent. If so, populate them.
    var errorFlash = req.flash('error');
    var successFlash = req.flash('success');
    console.log(`errorFlash: ${errorFlash}`);
    console.log(`successFlash: ${successFlash}`);

    // Look for error flash (get the first error).
    if (errorFlash && errorFlash.length) messages.push({ msg: errorFlash[0] });

    // Look for success flash (get the first success).
    if (successFlash && successFlash.length)
        messages.push({ msg: successFlash[0] });

    return messages;
}
