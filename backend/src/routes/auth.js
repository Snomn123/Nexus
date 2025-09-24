const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    refreshToken,
    me,
    registerValidation,
    loginValidation
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);

module.exports = router;