// perform authen for all request come to '/catalog'
const express = require('express');
const router = express.Router();

// ensure user is having valid session
const confirmAuthentication = (req, res, next) => {
    // if user is authenticated, check the role
    if (req.isAuthenticated()) {
        return next();
    } else {
        // if not, save flash error message + redirect to login page
        // to retrieve this error message, use req.flash('error')
        req.flash('error', 'You need to login first!');
        return res.redirect('/users/login');
    }
};

// make sure user have permission to interact
const confirmRole = (req, res, next) => {
    // get the operation user want to perform
    // example of req.path: /book/66923a7c3b9a03be5ecd6b68/delete
    let requestedOperation;
    if (req.path.endsWith('/create')) {
        requestedOperation = 'create';
    } else if (req.path.endsWith('/update')) {
        requestedOperation = 'update';
    } else if (req.path.endsWith('/delete')) {
        requestedOperation = 'delete';
    } else requestedOperation = 'read';

    const userRole = req.user.role; // (0,1,2)
    const allowOperations = {
        0: ['read'],
        1: ['read', 'create', 'update'],
        2: ['read', 'create', 'update', 'delete'],
    };

    if (allowOperations[userRole].includes(requestedOperation)) {
        return next();
    } else {
        // add error message to flash to display on pug
        req.flash('error', "You're not authorized to access this page!");
        return res.status(403).render('user_warning', {
            title: "You don't have permission to perform this operation",
        });
    }
};

router.use('/catalog', confirmAuthentication, confirmRole);

module.exports = router;
