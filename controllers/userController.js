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

// validation
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
    body('password_confirm', 'Password must be between 4-32 characters long.')
        .isLength({ min: 4, max: 32 })
        .trim(),
    body('*').escape(),

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
            hash: req.body.password,
        });
        await newUser.save();
        // resource created, return 201 Created
        return res.status(201).render('user_form', {
            title: 'Done create user',
        });
    }),
];

// if user already log in, redirect user to home page
function isAlreadyLogin(req, res, next) {
    if (req.user && req.isAuthenticated()) {
        return res.redirect('/');
    } else return next();
}
