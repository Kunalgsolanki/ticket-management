const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /user/signup
router.post('/signup', userController.signup);

// POST /user/login
router.post('/login', userController.login);

// GET /user  → list all users
router.get('/', userController.getAllUsers);

// GET /user/:id
router.get('/:id', userController.getUserById);

// PATCH /user/:id  → update name/email/role (and password separately, hashed)
router.patch('/:id', userController.updateUser);

// DELETE /user/:id
router.delete('/:id', userController.deleteUser);

module.exports = router;