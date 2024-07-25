// perform authen for all request come to '/catalog'

const passport = require('passport');
const express = require('express');
const router = express.Router();

const confirmAuthentication = (req, res, next) => {
    if (req.isAuthenticated()) {
        console.log('User is authenticated...');
        return next();
    } else {
        console.log("User isn't authenticated, back to login page...");
        return res.redirect('/users/login');
    }
};

router.use('/catalog', confirmAuthentication);

module.exports = router;
