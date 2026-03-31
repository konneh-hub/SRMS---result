const userManagementService = require('../services/userManagementService');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class UserManagementController {
  /**
   * Create a new user (hierarchical role creation)
   */
  async createUser(req, res) {
    try {
      const { email, password, firstName, lastName, role, universityId, department } = req.body;
      const tenantId = req.tenantId;
      const creatorId = req.user.userId;

      if (!email || !password || !firstName || !lastName || !role) {
        return sendError(res, 'Email, password, firstName, lastName, and role are required', 400);
      }

      const result = await userManagementService.createUser({
        email,
        password,
        firstName,
        lastName,
        role,
        universityId,
        department
      }, creatorId, tenantId);

      sendSuccess(res, 'User created successfully', result, 201);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ForbiddenError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to create user', 500);
      }
    }
  }

  /**
   * Bulk upload users (students and lecturers)
   */
  async bulkUploadUsers(req, res) {
    try {
      const { users } = req.body;
      const tenantId = req.tenantId;
      const uploaderId = req.user.userId;

      if (!Array.isArray(users) || users.length === 0) {
        return sendError(res, 'Users array is required and must not be empty', 400);
      }

      if (users.length > 1000) {
        return sendError(res, 'Maximum 1000 users can be uploaded at once', 400);
      }

      const results = await userManagementService.bulkUploadUsers(users, uploaderId, tenantId);

      sendSuccess(res, 'Bulk upload completed', {
        successful_count: results.successful.length,
        failed_count: results.failed.length,
        successful: results.successful,
        failed: results.failed
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ForbiddenError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to upload users', 500);
      }
    }
  }

  /**
   * Self-registration for students and lecturers
   */
  async selfRegister(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;
      const tenantId = req.tenantId;

      if (!email || !password || !firstName || !lastName) {
        return sendError(res, 'Email, password, firstName, and lastName are required', 400);
      }

      const result = await userManagementService.selfRegister({
        email,
        password,
        firstName,
        lastName
      }, tenantId);

      sendSuccess(res, 'Registration completed successfully', result);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ForbiddenError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to complete registration', 500);
      }
    }
  }

  /**
   * Get users by university
   */
  async getUsersByUniversity(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenantId;
      const { role, department, limit = 50, offset = 0 } = req.query;

      const filters = {
        role,
        department,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const users = await userManagementService.getUsersByUniversity(
        parseInt(universityId),
        tenantId,
        filters
      );

      sendSuccess(res, 'Users retrieved successfully', {
        users,
        pagination: {
          limit: filters.limit,
          offset: filters.offset
        }
      });
    } catch (error) {
      sendError(res, 'Failed to retrieve users', 500);
    }
  }

  /**
   * Update user information
   */
  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { firstName, lastName, department, isActive } = req.body;
      const tenantId = req.tenantId;
      const updaterId = req.user.userId;

      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (department !== undefined) updateData.department = department;
      if (isActive !== undefined) updateData.isActive = isActive;

      if (Object.keys(updateData).length === 0) {
        return sendError(res, 'At least one field must be provided for update', 400);
      }

      const updatedUser = await userManagementService.updateUser(
        userId,
        updateData,
        updaterId,
        tenantId
      );

      sendSuccess(res, 'User updated successfully', updatedUser);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ForbiddenError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to update user', 500);
      }
    }
  }

  /**
   * Get user statistics for a university
   */
  async getUserStats(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenantId;

      const stats = await userManagementService.getUserStats(
        parseInt(universityId),
        tenantId
      );

      sendSuccess(res, 'User statistics retrieved successfully', { stats });
    } catch (error) {
      sendError(res, 'Failed to retrieve user statistics', 500);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const tenantId = req.tenantId;

      const user = await userManagementService.userRepository.findById(userId, tenantId);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      const profile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        universityId: user.university_id,
        department: user.department,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

      sendSuccess(res, 'Profile retrieved successfully', { profile });
    } catch (error) {
      sendError(res, 'Failed to retrieve profile', 500);
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { firstName, lastName, department } = req.body;
      const tenantId = req.tenantId;

      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (department !== undefined) updateData.department = department;

      if (Object.keys(updateData).length === 0) {
        return sendError(res, 'At least one field must be provided for update', 400);
      }

      const updatedUser = await userManagementService.updateUser(
        userId,
        updateData,
        userId, // User can update themselves
        tenantId
      );

      const profile = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role,
        universityId: updatedUser.university_id,
        department: updatedUser.department,
        isActive: updatedUser.is_active,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      };

      sendSuccess(res, 'Profile updated successfully', { profile });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to update profile', 500);
      }
    }
  }
}

module.exports = new UserManagementController();