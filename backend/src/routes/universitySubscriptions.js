const express = require('express');
const router = express.Router();
const universitySubscriptionController = require('../controllers/universitySubscriptionController');

// Routes for university subscriptions
router.get('/', universitySubscriptionController.getAllSubscriptions);
router.get('/university/:universityId', universitySubscriptionController.getUniversitySubscriptions);
router.get('/university/:universityId/active', universitySubscriptionController.getActiveSubscription);
router.get('/expiring', universitySubscriptionController.getExpiringSubscriptions);
router.get('/stats', universitySubscriptionController.getSubscriptionStats);
router.post('/', universitySubscriptionController.createSubscription);
router.put('/:id', universitySubscriptionController.updateSubscription);
router.patch('/:id/renew', universitySubscriptionController.renewSubscription);
router.patch('/:id/cancel', universitySubscriptionController.cancelSubscription);

module.exports = router;