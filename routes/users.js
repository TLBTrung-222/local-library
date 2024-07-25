const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// handle request for '/users'
router.get('/login', userController.login_get);
router.post('/login', userController.login_post);
router.get('/register', userController.register_get);
router.post('/register', userController.register_post);

module.exports = router;
