const asyncHandler = require('express-async-handler');
const passport = require('passport');
const User = require('../models/user');
const { body, validationResult } = require('express-validator');

exports.login_get = [
    isAlreadyLogin,
    (req, res) => {
        res.render('user_login', {});
    },
];

exports.login_post = passport.authenticate('local', {
    successRedirect: '/catalog',
    failureRedirect: '/users/login',
});

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
        // validation error, return 400 Bad request
        if (!errors.isEmpty()) {
            return res.status(400).render('user_form', {
                title: 'Error',
                errors: errors.array(),
            });
        }
        // make sure password confirm is matched
        if (req.body.passwordConfirm !== req.body.password) {
            return res.status(400).render('user_form', {
                title: 'Confirm password wrong',
            });
        }
        // check if user exist yet
        const userExist = await User.findOne({
            username: req.body.username,
        }).exec();

        // username already exist, return 409 Conflict
        if (userExist) {
            return res.status(409).render('user_form', {
                title: 'User already existed',
                userExist: userExist,
            });
        }

        // user's infor is valid, save user
        const newUser = new User({
            username: req.body.username,
            fullname: req.body.fullname,
            email: req.body.email,
        });

        newUser.setPassword(req.body.password);
        await newUser.save();
        // resource created, return 201 Created
        res.redirect('/');
    }),
];

exports.profile = (req, res, next) => {
    // after authenticated, req.user contains object from deserializeUser
    // which mean a document
    const user = req.user;

    res.render('user_profile', { user });
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

        const updatedUser = await User.findOne(
            { username: req.body.username },
            {
                username: req.body.username,
                fullname: req.body.fullname,
                email: req.body.email,
            },
            { new: true }
        ).exec();

        updatedUser.setPassword(req.body.password);
        await updatedUser.save();

        res.render('user_form', {
            title: 'User updated!',
            userExist: updatedUser,
        });
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
