const AuthService = require('../services/authService');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Self-registration for students and lecturers
   * POST /api/auth/self-register
   */
  async selfRegister(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;
      const tenantId = req.tenantId; // From tenant middleware

      const result = await this.authService.selfRegister({
        email,
        password,
        firstName,
        lastName
      }, tenantId);

      res.status(201).json({
        success: true,
        message: 'Registration completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Self-registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, role, universityId, department } = req.body;
      const tenantId = req.tenantId; // From tenant middleware

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
        role,
        universityId,
        department,
        tenantId
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const tenantId = req.tenantId; // From tenant middleware

      const result = await this.authService.login({
        email,
        password,
        tenantId
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId; // From auth middleware
      const tenantId = req.tenantId; // From tenant middleware

      const profile = await this.authService.getProfile(userId, tenantId);

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Change user password
   * PUT /api/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.userId; // From auth middleware
      const tenantId = req.tenantId; // From tenant middleware

      await this.authService.changePassword(userId, oldPassword, newPassword, tenantId);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update user role (admin only)
   * PUT /api/auth/users/:userId/role
   */
  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const tenantId = req.tenantId; // From tenant middleware

      // Check if requester is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      await this.authService.updateUserRole(userId, role, tenantId);

      res.json({
        success: true,
        message: 'User role updated successfully'
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete user (admin only)
   * DELETE /api/auth/users/:userId
   */
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const tenantId = req.tenantId; // From tenant middleware

      // Check if requester is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      await this.authService.deleteUser(userId, tenantId);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get all users (admin only)
   * GET /api/auth/users
   */
  async getAllUsers(req, res) {
    try {
      const tenantId = req.tenantId; // From tenant middleware

      // Check if requester is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const { limit, offset } = req.query;
      const options = {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      };

      const users = await this.authService.getAllUsers(tenantId, options);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = AuthController;