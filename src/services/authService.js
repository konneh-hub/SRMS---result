const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/userRepository');

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against its hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @returns {string} JWT token
   */
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded payload or null if invalid
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.firstName - User first name
   * @param {string} userData.lastName - User last name
   * @param {string} userData.role - User role (defaults to 'student')
   * @param {number} userData.universityId - University ID (required for most roles)
   * @param {string} userData.department - Department (optional)
   * @param {string} userData.tenantId - Tenant ID
   * @returns {Promise<Object>} User object and token
   */
  async register({ email, password, firstName, lastName, role = 'student', universityId, department, tenantId }) {
    // Validate input
    if (!email || !password || !tenantId) {
      throw new Error('Email, password, and tenant ID are required');
    }

    // Validate role
    const validRoles = ['system_admin', 'university_admin', 'dean', 'hod', 'exam_officer', 'lecturer', 'student'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email, tenantId);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate university_id for roles that require it
    const rolesRequiringUniversity = ['university_admin', 'dean', 'hod', 'exam_officer', 'lecturer', 'student'];
    if (rolesRequiringUniversity.includes(role) && !universityId) {
      throw new Error(`University ID is required for role: ${role}`);
    }

    // System admin doesn't need university_id
    if (role === 'system_admin' && universityId) {
      throw new Error('System admin cannot be assigned to a specific university');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      universityId,
      department,
      tenantId
    });

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      universityId: user.university_id
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        universityId: user.university_id,
        department: user.department,
        tenantId: user.tenant_id,
        createdAt: user.created_at
      },
      token
    };
  }

  /**
   * Self-registration for students and lecturers
   * @param {Object} registrationData - Registration data
   * @param {string} registrationData.email - User email
   * @param {string} registrationData.password - User password
   * @param {string} registrationData.firstName - User first name
   * @param {string} registrationData.lastName - User last name
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} User object and token
   */
  async selfRegister({ email, password, firstName, lastName }, tenantId) {
    // Find user by email
    const existingUser = await this.userRepository.findByEmail(email, tenantId);
    if (!existingUser) {
      throw new Error('No user found with this email. Please contact your university administrator.');
    }

    // Check if user is already registered (has password)
    if (existingUser.password_hash) {
      throw new Error('User is already registered. Please use login instead.');
    }

    // Validate role allows self-registration
    if (!['student', 'lecturer'].includes(existingUser.role)) {
      throw new Error('Self-registration is only available for students and lecturers.');
    }

    // Validate provided name matches existing record
    if (existingUser.first_name !== firstName || existingUser.last_name !== lastName) {
      throw new Error('Name does not match our records. Please contact your university administrator.');
    }

    // Hash password and update user
    const passwordHash = await this.hashPassword(password);
    await this.userRepository.updatePassword(existingUser.id, passwordHash, tenantId);

    // Generate token
    const token = this.generateToken({
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
   * Login user
   * @param {Object} credentials - User login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {string} credentials.tenantId - Tenant ID
   * @returns {Promise<Object>} User object and token
   */
  async login({ email, password, tenantId }) {
    // Validate input
    if (!email || !password || !tenantId) {
      throw new Error('Email, password, and tenant ID are required');
    }

    // Find user
    const user = await this.userRepository.findByEmail(email, tenantId);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      universityId: user.university_id
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        universityId: user.university_id,
        department: user.department,
        tenantId: user.tenant_id,
        createdAt: user.created_at
      },
      token
    };
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId, tenantId) {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, oldPassword, newPassword, tenantId) {
    // Find user
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValidPassword = await this.verifyPassword(oldPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    const success = await this.userRepository.updatePassword(userId, newPasswordHash, tenantId);
    if (!success) {
      throw new Error('Failed to update password');
    }

    return true;
  }

  /**
   * Update user role (admin only)
   * @param {string} userId - User ID to update
   * @param {string} newRole - New role
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>} Success status
   */
  async updateUserRole(userId, newRole, tenantId) {
    const validRoles = ['admin', 'user', 'moderator'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    const success = await this.userRepository.updateRole(userId, newRole, tenantId);
    if (!success) {
      throw new Error('Failed to update user role');
    }

    return true;
  }

  /**
   * Delete user (admin only)
   * @param {string} userId - User ID to delete
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId, tenantId) {
    const success = await this.userRepository.delete(userId, tenantId);
    if (!success) {
      throw new Error('Failed to delete user');
    }

    return true;
  }

  /**
   * Get all users for a tenant (admin only)
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of users
   */
  async getAllUsers(tenantId, options = {}) {
    return await this.userRepository.findAllByTenant(tenantId, options);
  }
}

module.exports = AuthService;