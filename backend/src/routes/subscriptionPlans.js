const express = require('express');
const router = express.Router();
const subscriptionPlanController = require('../controllers/subscriptionPlanController');
const { subscriptionRateLimit } = require('../middleware/security');

// Apply rate limiting to all subscription plan routes
router.use(subscriptionRateLimit);

// Routes for subscription plans
router.get('/', subscriptionPlanController.getAllPlans);
router.get('/active', subscriptionPlanController.getActivePlans);
router.get('/:id', subscriptionPlanController.getPlanById);
router.post('/', subscriptionPlanController.createPlan);
router.put('/:id', subscriptionPlanController.updatePlan);
router.delete('/:id', subscriptionPlanController.deletePlan);
router.patch('/:id/activate', subscriptionPlanController.activatePlan);
router.patch('/:id/deactivate', subscriptionPlanController.deactivatePlan);

// Routes for checking subscription limits
router.get('/limits/universities/:universityId/students', subscriptionPlanController.checkStudentLimit);
router.get('/limits/universities/:universityId/staff', subscriptionPlanController.checkStaffLimit);
router.get('/limits/universities/:universityId/validate', subscriptionPlanController.validateLimits);

module.exports = router;