const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Import route modules
const universityRoutes = require('./universities');
const studentRoutes = require('./students');
const subscriptionPlanRoutes = require('./subscriptionPlans');
const universitySubscriptionRoutes = require('./universitySubscriptions');
const billingRoutes = require('./billing');
const paymentRoutes = require('./payments');
const userRoutes = require('./users');
const facultyRoutes = require('./facultyRoutes');
const departmentRoutes = require('./departmentRoutes');
const programRoutes = require('./programRoutes');
const courseRoutes = require('./courseRoutes');
const enrollmentRoutes = require('./enrollments');
const resultRoutes = require('./results');
const gradingScaleRoutes = require('./gradingScales');
const notificationRoutes = require('./notifications');
const auditRoutes = require('./audit');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();

    const health = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth
      },
      tenant: req.tenant ? req.tenant.id : 'no-tenant'
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      tenant: req.tenant ? req.tenant.id : 'no-tenant'
    });
  }
});

// Mount routes
router.use('/universities', universityRoutes);
router.use('/students', studentRoutes);
router.use('/subscription-plans', subscriptionPlanRoutes);
router.use('/subscriptions', universitySubscriptionRoutes);
router.use('/billing', billingRoutes);
router.use('/payments', paymentRoutes);
router.use('/users', userRoutes);
router.use('/faculties', facultyRoutes);
router.use('/departments', departmentRoutes);
router.use('/programs', programRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/results', resultRoutes);
router.use('/grading-scales', gradingScaleRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);

module.exports = router;