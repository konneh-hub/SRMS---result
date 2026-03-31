const universitySubscriptionService = require('../services/universitySubscriptionService');

// University Subscription Controller - Handles HTTP layer concerns only
const universitySubscriptionController = {
  // Get all subscriptions
  async getAllSubscriptions(req, res) {
    try {
      const tenantId = req.tenant.id;
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        orderBy: req.query.orderBy || 'created_at',
        orderDirection: req.query.orderDirection || 'DESC'
      };

      const result = await universitySubscriptionService.getAllSubscriptions(tenantId, options);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllSubscriptions controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscriptions'
      });
    }
  },

  // Get subscriptions for a specific university
  async getUniversitySubscriptions(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can access any university's subscriptions, others can only access their own
      if (userRole !== 'system_admin' && userRole !== 'university_admin' && userUniversityId && parseInt(universityId) !== userUniversityId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access subscriptions for your assigned university.'
        });
      }

      const result = await universitySubscriptionService.getUniversitySubscriptions(universityId, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getUniversitySubscriptions controller:', error);

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch university subscriptions'
      });
    }
  },

  // Get active subscription for a university
  async getActiveSubscription(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can access any university's active subscription, others can only access their own
      if (userRole !== 'system_admin' && userRole !== 'university_admin' && userUniversityId && parseInt(universityId) !== userUniversityId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access subscriptions for your assigned university.'
        });
      }

      const result = await universitySubscriptionService.getActiveSubscription(universityId, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getActiveSubscription controller:', error);

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch active subscription'
      });
    }
  },

  // Create a new subscription
  async createSubscription(req, res) {
    try {
      // Only system admins can create subscriptions
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can create subscriptions.'
        });
      }

      const tenantId = req.tenant.id;
      const result = await universitySubscriptionService.createSubscription(req.body, tenantId);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createSubscription controller:', error);

      if (error.message.includes('required') || error.message.includes('Valid') ||
          error.message.includes('not found') || error.message.includes('already has')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create subscription'
      });
    }
  },

  // Update a subscription
  async updateSubscription(req, res) {
    try {
      // Only system admins can update subscriptions
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can update subscriptions.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await universitySubscriptionService.updateSubscription(id, req.body, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in updateSubscription controller:', error);

      if (error.message === 'Subscription not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update subscription'
      });
    }
  },

  // Renew a subscription
  async renewSubscription(req, res) {
    try {
      // Only system admins can renew subscriptions
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can renew subscriptions.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await universitySubscriptionService.renewSubscription(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in renewSubscription controller:', error);

      if (error.message === 'Subscription not found' || error.message === 'Subscription plan not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to renew subscription'
      });
    }
  },

  // Cancel a subscription
  async cancelSubscription(req, res) {
    try {
      // Only system admins can cancel subscriptions
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can cancel subscriptions.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await universitySubscriptionService.cancelSubscription(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in cancelSubscription controller:', error);

      if (error.message === 'Subscription not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription'
      });
    }
  },

  // Get subscriptions expiring soon
  async getExpiringSubscriptions(req, res) {
    try {
      const tenantId = req.tenant.id;
      const days = req.query.days ? parseInt(req.query.days) : 30;
      const result = await universitySubscriptionService.getExpiringSubscriptions(tenantId, days);
      res.json(result);
    } catch (error) {
      console.error('Error in getExpiringSubscriptions controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch expiring subscriptions'
      });
    }
  },

  // Get subscription statistics
  async getSubscriptionStats(req, res) {
    try {
      const tenantId = req.tenant.id;
      const result = await universitySubscriptionService.getSubscriptionStats(tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getSubscriptionStats controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription statistics'
      });
    }
  }
};

module.exports = universitySubscriptionController;