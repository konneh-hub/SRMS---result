const universityService = require('../services/universityService');

// University Controller - Handles HTTP layer concerns only
const universityController = {
  // Get all universities for the current tenant
  async getAllUniversities(req, res) {
    try {
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;

      // System admins can see all universities, others see only their university
      const universityId = req.user?.role === 'system_admin' ? null : userUniversityId;

      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        orderBy: req.query.orderBy || 'created_at',
        orderDirection: req.query.orderDirection || 'DESC'
      };

      const result = await universityService.getAllUniversities(tenantId, universityId, options);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllUniversities controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch universities'
      });
    }
  },

  // Get a specific university by ID
  async getUniversityById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;

      // System admins can access any university, others can only access their own
      if (req.user?.role !== 'system_admin' && userUniversityId && parseInt(id) !== userUniversityId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access your assigned university.'
        });
      }

      const result = await universityService.getUniversityById(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getUniversityById controller:', error);

      if (error.message === 'University not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Invalid university ID') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch university'
      });
    }
  },

  // Create a new university
  async createUniversity(req, res) {
    try {
      // Only system admins can create universities
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can create universities.'
        });
      }

      const tenantId = req.tenant.id;
      const result = await universityService.createUniversity(req.body, tenantId);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createUniversity controller:', error);

      if (error.message.includes('required') || error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create university'
      });
    }
  },

  // Update a university
  async updateUniversity(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;

      // System admins can update any university, university admins can only update their own
      if (req.user?.role !== 'system_admin' && userUniversityId && parseInt(id) !== userUniversityId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only update your assigned university.'
        });
      }

      const result = await universityService.updateUniversity(id, req.body, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in updateUniversity controller:', error);

      if (error.message === 'University not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update university'
      });
    }
  },

  // Delete a university
  async deleteUniversity(req, res) {
    try {
      // Only system admins can delete universities
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can delete universities.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;

      const result = await universityService.deleteUniversity(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteUniversity controller:', error);

      if (error.message === 'University not found') {
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

      if (error.message.includes('associated students')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete university'
      });
    }
  },

  // Get universities with student count
  async getUniversitiesWithStats(req, res) {
    try {
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;

      // System admins can see all universities, others see only their university
      const universityId = req.user?.role === 'system_admin' ? null : userUniversityId;

      const result = await universityService.getUniversitiesWithStats(tenantId, universityId);
      res.json(result);
    } catch (error) {
      console.error('Error in getUniversitiesWithStats controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch universities with stats'
      });
    }
  },

  // Create university with admin
  async createUniversityWithAdmin(req, res) {
    try {
      // Only system admins can create universities with admins
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can create universities with admins.'
        });
      }

      const tenantId = req.tenant.id;
      const { university, admin } = req.body;

      if (!university || !admin) {
        return res.status(400).json({
          success: false,
          error: 'Both university and admin data are required'
        });
      }

      const result = await universityService.createUniversityAdmin(university, admin, tenantId);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createUniversityWithAdmin controller:', error);

      if (error.message.includes('required') || error.message.includes('Invalid') ||
          error.message.includes('already exists') || error.message.includes('Both university')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create university with admin'
      });
    }
  },

  // Activate a university
  async activateUniversity(req, res) {
    try {
      // Only system admins can activate universities
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can activate universities.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await universityService.activateUniversity(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in activateUniversity controller:', error);

      if (error.message === 'University not found') {
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
        error: 'Failed to activate university'
      });
    }
  },

  // Deactivate a university
  async deactivateUniversity(req, res) {
    try {
      // Only system admins can deactivate universities
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can deactivate universities.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await universityService.deactivateUniversity(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in deactivateUniversity controller:', error);

      if (error.message === 'University not found') {
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
        error: 'Failed to deactivate university'
      });
    }
  },

  // Suspend a university
  async suspendUniversity(req, res) {
    try {
      // Only system admins can suspend universities
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only system administrators can suspend universities.'
        });
      }

      const { id } = req.params;
      const tenantId = req.tenant.id;
      const result = await universityService.suspendUniversity(id, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in suspendUniversity controller:', error);

      if (error.message === 'University not found') {
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
        error: 'Failed to suspend university'
      });
    }
  },

  // Get universities by status
  async getUniversitiesByStatus(req, res) {
    try {
      const { status } = req.params;
      const tenantId = req.tenant.id;

      // Validate status
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be one of: active, inactive, suspended'
        });
      }

      const result = await universityService.getUniversitiesByStatus(status, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getUniversitiesByStatus controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch universities by status'
      });
    }
  },

  // Get university statistics
  async getUniversityStats(req, res) {
    try {
      const tenantId = req.tenant.id;
      const result = await universityService.getUniversityStats(tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getUniversityStats controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch university statistics'
      });
    }
  }
};

module.exports = universityController;