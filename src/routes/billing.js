const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');
const { billingRateLimit } = require('../middleware/security');

// All billing routes require authentication and rate limiting
router.use(authenticate);
router.use(billingRateLimit);

// Create billing record for a subscription
router.post('/universities/:universityId/subscriptions/:subscriptionId/billing',
  authorize(['system_admin', 'university_admin']),
  billingController.createBillingRecord
);

// Get billing records for a university
router.get('/universities/:universityId/billing',
  authorize(['system_admin', 'university_admin']),
  billingController.getUniversityBillingRecords
);

// Get pending payments (system admin only)
router.get('/pending-payments',
  authorize(['system_admin']),
  billingController.getPendingPayments
);

// Get overdue payments (system admin only)
router.get('/overdue-payments',
  authorize(['system_admin']),
  billingController.getOverduePayments
);

// Update billing record status
router.patch('/billing/:billingRecordId/status',
  authorize(['system_admin']),
  billingController.updateBillingStatus
);

// Get billing statistics (system admin only)
router.get('/stats',
  authorize(['system_admin']),
  billingController.getBillingStats
);

// Generate monthly billing (system admin only)
router.post('/generate-monthly',
  authorize(['system_admin']),
  billingController.generateMonthlyBilling
);

module.exports = router;