// perform authen for all request come to '/catalog'

const passport = require('passport');
const express = require('express');
const router = express.Router();

// ensure user is having valid session
const confirmAuthentication = (req, res, next) => {
    if (req.isAuthenticated()) {
        console.log('User have authenticated, back to home page...');
        return next();
    } else {
        console.log("User haven't authenticated, back to login page...");
        return res.redirect('/users/login');
    }
};

router.use('/catalog', confirmAuthentication);

module.exports = router;
