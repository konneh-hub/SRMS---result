const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticate, requireSystemAdmin } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/security');

const router = express.Router();
const authController = new AuthController();

// Apply strict rate limiting to authentication endpoints
router.use('/login', authRateLimit);
router.use('/register', authRateLimit);
router.use('/self-register', authRateLimit);

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/self-register', authController.selfRegister.bind(authController));

// Protected routes
router.get('/profile', authenticate, authController.getProfile.bind(authController));
router.put('/change-password', authenticate, authController.changePassword.bind(authController));

// Admin-only routes
router.get('/users', authenticate, requireSystemAdmin, authController.getAllUsers.bind(authController));
router.put('/users/:userId/role', authenticate, requireSystemAdmin, authController.updateUserRole.bind(authController));
router.delete('/users/:userId', authenticate, requireSystemAdmin, authController.deleteUser.bind(authController));

module.exports = router;