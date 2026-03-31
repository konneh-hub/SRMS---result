// Audit Routes
// API routes for audit logging functionality

const express = require('express');
const AuditController = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { validateTenantAccess } = require('../middleware/tenant');
const {
  validateAuditLogQuery,
  validateAuditStatsQuery,
  validateUserActivityQuery,
  validateAuditExportQuery,
  validateAuditLogId,
  validateUserId
} = require('../middleware/validation');
const { auditRateLimit } = require('../middleware/security');

const router = express.Router();
const auditController = new AuditController();

// All audit routes require authentication and tenant validation
router.use(authenticate);
router.use(validateTenantAccess);
router.use(auditRateLimit); // Apply audit-specific rate limiting

/**
 * @route GET /api/audit/logs
 * @desc Get audit logs with filtering and pagination
 * @access Admin, Super Admin
 */
router.get('/logs', (req, res, next) => {
  // Check if user has admin privileges
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: Admin privileges required'
    });
  }
  auditController.getAuditLogs(req, res, next);
});

/**
 * @route GET /api/audit/logs/:id
 * @desc Get specific audit log details
 * @access Admin, Super Admin
 */
router.get('/logs/:id', validateAuditLogId, (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: Admin privileges required'
    });
  }
  auditController.getAuditLogDetails(req, res, next);
});

/**
 * @route GET /api/audit/stats
 * @desc Get audit statistics
 * @access Admin, Super Admin
 */
router.get('/stats', (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: Admin privileges required'
    });
  }
  auditController.getAuditStats(req, res, next);
});

/**
 * @route GET /api/audit/user-activity/:userId
 * @desc Get user activity logs
 * @access Admin, Super Admin, or own activity
 */
router.get('/user-activity/:userId', validateUserId, validateUserActivityQuery, auditController.getUserActivity);

/**
 * @route GET /api/audit/export
 * @desc Export audit logs in JSON or CSV format
 * @access Admin, Super Admin
 */
router.get('/export', (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: Admin privileges required'
    });
  }
  auditController.exportAuditLogs(req, res, next);
});

module.exports = router;