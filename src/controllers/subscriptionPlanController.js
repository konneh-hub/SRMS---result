const subscriptionPlanService = require('../services/subscriptionPlanService');

// Subscription Plan Controller - Handles HTTP layer concerns only
const subscriptionPlanController = {
  // Get all subscription plans
  async getAllPlans(req, res) {
    try {
      const tenantId = req.tenant.id;
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        orderBy: req.query.orderBy || 'created_at',
        orderDirection: req.query.orderDirection || 'DESC'
      };

      const result = await subscriptionPlanService.getAllPlans(tenantId, options);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllPlans controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription plans'
      });
    }
  },

  // Get active subscription plans
  async getActivePlans(req, res) {
    try {
      const tenantId = req.tenant.id;
      const result = await subscriptionPlanService.getActivePlans(tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getActivePlans controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active plans'
      });
    }
  },

  // Get a specific subscription plan by ID
  async getPlanById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.tenant.id;

      const result = await subscriptionPlanService.getPlanById(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getPlanById controller:', error);

      if (error.message === 'Subscription plan not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Invalid plan ID') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription plan'
      });
    }
  },

  // Create a new subscription plan
  async createPlan(req, res) {
    try {
      // Only system admins can create subscription plans
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can create subscription plans.'
        });
      }

      const tenantId = req.tenant.id;
      const result = await subscriptionPlanService.createPlan(req.body, tenantId);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createPlan controller:', error);

      if (error.message.includes('required') || error.message.includes('Valid') || error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create subscription plan'
      });
    }
  },

  // Update a subscription plan
  async updatePlan(req, res) {
    try {
      // Only system admins can update subscription plans
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can update subscription plans.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await subscriptionPlanService.updatePlan(id, req.body, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in updatePlan controller:', error);

      if (error.message === 'Subscription plan not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('Valid') || error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update subscription plan'
      });
    }
  },

  // Delete a subscription plan
  async deletePlan(req, res) {
    try {
      // Only system admins can delete subscription plans
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can delete subscription plans.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await subscriptionPlanService.deletePlan(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in deletePlan controller:', error);

      if (error.message === 'Subscription plan not found') {
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
        error: 'Failed to delete subscription plan'
      });
    }
  },

  // Activate a subscription plan
  async activatePlan(req, res) {
    try {
      // Only system admins can activate subscription plans
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can activate subscription plans.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await subscriptionPlanService.activatePlan(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in activatePlan controller:', error);

      if (error.message === 'Subscription plan not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to activate subscription plan'
      });
    }
  },

  // Deactivate a subscription plan
  async deactivatePlan(req, res) {
    try {
      // Only system admins can deactivate subscription plans
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can deactivate subscription plans.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await subscriptionPlanService.deactivatePlan(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in deactivatePlan controller:', error);

      if (error.message === 'Subscription plan not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to deactivate subscription plan'
      });
    }
  },

  // Check student limit for a university
  async checkStudentLimit(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenant.id;

      const result = await subscriptionPlanService.checkStudentLimit(universityId, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in checkStudentLimit controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check student limit'
      });
    }
  },

  // Check staff limit for a university
  async checkStaffLimit(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenant.id;

      const result = await subscriptionPlanService.checkStaffLimit(universityId, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in checkStaffLimit controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check staff limit'
      });
    }
  },

  // Validate all limits for a university
  async validateLimits(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenant.id;

      const result = await subscriptionPlanService.validateLimits(universityId, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in validateLimits controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate limits'
      });
    }
  }
};

module.exports = subscriptionPlanController;