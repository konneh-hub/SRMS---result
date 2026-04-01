const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController');
const { authenticate, authorize } = require('../middleware/auth');
const { userRateLimit } = require('../middleware/security');

// All user management routes require authentication and rate limiting
router.use(authenticate);
router.use(userRateLimit);

// Create user (hierarchical role creation)
router.post('/',
  authorize(['system_admin', 'university_admin']),
  userManagementController.createUser
);

// Bulk upload users (university admin only)
router.post('/bulk-upload',
  authorize(['university_admin']),
  userManagementController.bulkUploadUsers
);

// Self-registration for students and lecturers (no auth required for this endpoint)
router.post('/self-register',
  userManagementController.selfRegister
);

// Get users by university
router.get('/university/:universityId',
  authorize(['system_admin', 'university_admin']),
  userManagementController.getUsersByUniversity
);

// Update user
router.patch('/:userId',
  authorize(['system_admin', 'university_admin']),
  userManagementController.updateUser
);

// Get user statistics for university
router.get('/university/:universityId/stats',
  authorize(['system_admin', 'university_admin']),
  userManagementController.getUserStats
);

// Profile routes (for authenticated users)
router.get('/profile', userManagementController.getProfile);
router.patch('/profile', userManagementController.updateProfile);

module.exports = router;