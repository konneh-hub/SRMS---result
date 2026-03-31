const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { paymentRateLimit } = require('../middleware/security');

// All payment routes require authentication and rate limiting
router.use(authenticate);
router.use(paymentRateLimit);

// Process payment for a billing record
router.post('/billing/:billingRecordId/process',
  authorize(['system_admin', 'university_admin']),
  paymentController.processPayment
);

// Get payments for a university
router.get('/universities/:universityId/payments',
  authorize(['system_admin', 'university_admin']),
  paymentController.getUniversityPayments
);

// Get payments for a specific billing record
router.get('/billing/:billingRecordId/payments',
  authorize(['system_admin', 'university_admin']),
  paymentController.getBillingPayments
);

// Process payment for a subscription directly
router.post('/subscriptions/:subscriptionId/process',
  authorize(['system_admin', 'university_admin']),
  paymentController.processSubscriptionPayment
);

// Refund a payment
router.post('/payments/:paymentRecordId/refund',
  authorize(['system_admin']),
  paymentController.refundPayment
);

// Update payment status
router.patch('/payments/:paymentRecordId/status',
  authorize(['system_admin']),
  paymentController.updatePaymentStatus
);

// Get payment statistics (system admin only)
router.get('/stats',
  authorize(['system_admin']),
  paymentController.getPaymentStats
);

module.exports = router;