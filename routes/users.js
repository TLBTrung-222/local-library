const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// handle request for '/users'
router.get('/login', userController.login_get);
router.post('/login', userController.login_post);
router.get('/logout', userController.log_out);
router.get('/register', userController.register_get);
router.post('/register', userController.register_post);
router.get('/:id', userController.profile);
router.get('/:id/update', userController.update_get);
router.post('/:id/update', userController.update_post);
// todo implement update_post

module.exports = router;
