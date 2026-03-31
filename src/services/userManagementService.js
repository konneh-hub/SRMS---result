const userRepository = require('../repositories/userRepository');
const universityRepository = require('../repositories/universityRepository');
const authService = require('./authService');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');

class UserManagementService {
  constructor() {
    this.userRepository = userRepository;
    this.universityRepository = universityRepository;
    this.authService = new authService();
  }

  /**
   * Create a user with role-based permissions
   * @param {Object} userData - User creation data
   * @param {string} creatorId - ID of the user creating this account
   * @param {string} tenantId - Tenant ID
   */
  async createUser(userData, creatorId, tenantId) {
    const { email, password, firstName, lastName, role, universityId, department } = userData;

    // Get creator information
    const creator = await this.userRepository.findById(creatorId, tenantId);
    if (!creator) {
      throw new NotFoundError('Creator not found');
    }

    // Validate role creation permissions
    await this.validateRoleCreationPermission(creator.role, role, universityId, tenantId);

    // Validate university exists if provided
    if (universityId) {
      const university = await this.universityRepository.findById(universityId, tenantId);
      if (!university) {
        throw new NotFoundError('University not found');
      }
    }

    // Create the user using auth service
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

    return result;
  }

  /**
   * Validate if a user can create accounts with a specific role
   */
  async validateRoleCreationPermission(creatorRole, targetRole, universityId, tenantId) {
    const roleHierarchy = {
      'system_admin': ['system_admin', 'university_admin'],
      'university_admin': ['dean', 'hod', 'exam_officer', 'lecturer', 'student'],
      'dean': [],
      'hod': [],
      'exam_officer': [],
      'lecturer': [],
      'student': []
    };

    if (!roleHierarchy[creatorRole] || !roleHierarchy[creatorRole].includes(targetRole)) {
      throw new ForbiddenError(`Users with role '${creatorRole}' cannot create users with role '${targetRole}'`);
    }

    // Additional validation for university_admin
    if (creatorRole === 'university_admin') {
      const creator = await this.userRepository.findAllByTenant(tenantId).then(users =>
        users.find(u => u.id === creatorId && u.role === 'university_admin')
      );

      if (!creator || creator.university_id !== universityId) {
        throw new ForbiddenError('University admin can only create users for their assigned university');
      }
    }
  }

  /**
   * Bulk upload users (students and lecturers)
   * @param {Array} usersData - Array of user data
   * @param {string} uploaderId - ID of the user uploading
   * @param {string} tenantId - Tenant ID
   */
  async bulkUploadUsers(usersData, uploaderId, tenantId) {
    // Validate uploader permissions
    const uploader = await this.userRepository.findById(uploaderId, tenantId);
    if (!uploader || uploader.role !== 'university_admin') {
      throw new ForbiddenError('Only university admins can upload user data');
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const userData of usersData) {
      try {
        // Validate required fields
        if (!userData.email || !userData.firstName || !userData.lastName || !userData.role) {
          throw new ValidationError('Email, firstName, lastName, and role are required');
        }

        // Validate role
        if (!['lecturer', 'student'].includes(userData.role)) {
          throw new ValidationError('Bulk upload only supports lecturer and student roles');
        }

        // Generate temporary password
        const tempPassword = this.generateTempPassword();

        const result = await this.createUser({
          ...userData,
          password: tempPassword,
          universityId: uploader.university_id
        }, uploaderId, tenantId);

        results.successful.push({
          ...result.user,
          tempPassword
        });

      } catch (error) {
        results.failed.push({
          userData,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Self-registration for students and lecturers
   * @param {Object} registrationData - Registration data
   * @param {string} tenantId - Tenant ID
   */
  async selfRegister(registrationData, tenantId) {
    const { email, password, firstName, lastName, registrationToken } = registrationData;

    // Find user by email
    const existingUser = await this.userRepository.findByEmail(email, tenantId);
    if (!existingUser) {
      throw new NotFoundError('No user found with this email. Please contact your university administrator.');
    }

    // Check if user is already registered (has password)
    if (existingUser.password_hash) {
      throw new ValidationError('User is already registered. Please use login instead.');
    }

    // Validate role allows self-registration
    if (!['student', 'lecturer'].includes(existingUser.role)) {
      throw new ForbiddenError('Self-registration is only available for students and lecturers.');
    }

    // Update user with password
    const passwordHash = await this.authService.hashPassword(password);
    await this.userRepository.updatePassword(existingUser.id, passwordHash, tenantId);

    // Generate token for login
    const token = this.authService.generateToken({
      userId: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      tenantId: existingUser.tenant_id,
      universityId: existingUser.university_id
    });

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.first_name,
        lastName: existingUser.last_name,
        role: existingUser.role,
        universityId: existingUser.university_id,
        department: existingUser.department
      },
      token
    };
  }

  /**
   * Get users by university
   * @param {number} universityId - University ID
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter options
   */
  async getUsersByUniversity(universityId, tenantId, filters = {}) {
    const { role, department, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT id, email, first_name, last_name, role, university_id, department, tenant_id, is_active, created_at, updated_at
      FROM users
      WHERE tenant_id = $1 AND university_id = $2
    `;
    const params = [tenantId, universityId];
    let paramIndex = 3;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (department) {
      query += ` AND department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.userRepository.db.query(query, params);
    return result.rows;
  }

  /**
   * Update user information
   * @param {string} userId - User ID to update
   * @param {Object} updateData - Data to update
   * @param {string} updaterId - ID of user making the update
   * @param {string} tenantId - Tenant ID
   */
  async updateUser(userId, updateData, updaterId, tenantId) {
    // Get updater information
    const updater = await this.userRepository.findById(updaterId, tenantId);
    if (!updater) {
      throw new NotFoundError('Updater not found');
    }

    // Get target user
    const targetUser = await this.userRepository.findById(userId, tenantId);
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check permissions
    if (updater.role === 'system_admin') {
      // System admin can update anyone
    } else if (updater.role === 'university_admin' && updater.university_id === targetUser.university_id) {
      // University admin can update users in their university
      const allowedRoles = ['dean', 'hod', 'exam_officer', 'lecturer', 'student'];
      if (!allowedRoles.includes(targetUser.role)) {
        throw new ForbiddenError('University admin cannot modify this user type');
      }
    } else {
      throw new ForbiddenError('Insufficient permissions to update this user');
    }

    // Prepare update data
    const updateFields = {};
    const params = [userId, tenantId];
    let paramIndex = 3;

    if (updateData.firstName !== undefined) {
      updateFields.first_name = `$${paramIndex}`;
      params.push(updateData.firstName);
      paramIndex++;
    }

    if (updateData.lastName !== undefined) {
      updateFields.last_name = `$${paramIndex}`;
      params.push(updateData.lastName);
      paramIndex++;
    }

    if (updateData.department !== undefined) {
      updateFields.department = `$${paramIndex}`;
      params.push(updateData.department);
      paramIndex++;
    }

    if (updateData.isActive !== undefined) {
      updateFields.is_active = `$${paramIndex}`;
      params.push(updateData.isActive);
      paramIndex++;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const setClause = Object.keys(updateFields).map(field => `${field} = ${updateFields[field]}`).join(', ');

    const query = `
      UPDATE users
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, email, first_name, last_name, role, university_id, department, tenant_id, is_active, created_at, updated_at
    `;

    const result = await this.userRepository.db.query(query, params);
    return result.rows[0];
  }

  /**
   * Generate a temporary password
   */
  generateTempPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get user statistics for a university
   * @param {number} universityId - University ID
   * @param {string} tenantId - Tenant ID
   */
  async getUserStats(universityId, tenantId) {
    const query = `
      SELECT
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
      FROM users
      WHERE tenant_id = $1 AND university_id = $2
      GROUP BY role
      ORDER BY role
    `;

    const result = await this.userRepository.db.query(query, [tenantId, universityId]);
    return result.rows;
  }
}

module.exports = new UserManagementService();