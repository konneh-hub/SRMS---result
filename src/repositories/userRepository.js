const BaseRepository = require('./baseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmail(email, tenantId) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, role, university_id, department, tenant_id, is_active, created_at, updated_at
      FROM users
      WHERE email = $1 AND tenant_id = $2
    `;
    const result = await this.db.query(query, [email, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @param {string} tenantId - Tenant ID
   * @param {number} universityId - University ID (optional)
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(id, tenantId, universityId = null) {
    let query = `
      SELECT id, email, first_name, last_name, role, university_id, department, tenant_id, is_active, created_at, updated_at
      FROM users
      WHERE id = $1 AND tenant_id = $2
    `;
    const params = [id, tenantId];

    // Add university scoping if provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    const result = await this.db.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.passwordHash - Hashed password
   * @param {string} userData.firstName - User first name
   * @param {string} userData.lastName - User last name
   * @param {string} userData.role - User role
   * @param {number} userData.universityId - University ID (optional)
   * @param {string} userData.department - Department (optional)
   * @param {string} userData.tenantId - Tenant ID
   * @returns {Promise<Object>} Created user object
   */
  async create({ email, passwordHash, firstName, lastName, role, universityId, department, tenantId }) {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, university_id, department, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, email, first_name, last_name, role, university_id, department, tenant_id, created_at, updated_at
    `;
    const result = await this.db.query(query, [email, passwordHash, firstName, lastName, role, universityId, department, tenantId]);
    return result.rows[0];
  }

  /**
   * Update user password
   * @param {string} id - User ID
   * @param {string} passwordHash - New hashed password
   * @param {string} tenantId - Tenant ID
   * @param {number} universityId - University ID (optional)
   * @returns {Promise<boolean>} Success status
   */
  async updatePassword(id, passwordHash, tenantId, universityId = null) {
    let query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `;
    const params = [passwordHash, id, tenantId];

    // Add university scoping if provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    const result = await this.db.query(query, params);
    return result.rowCount > 0;
  }

  /**
   * Update user role
   * @param {string} id - User ID
   * @param {string} role - New role
   * @param {string} tenantId - Tenant ID
   * @param {number} universityId - University ID (optional)
   * @returns {Promise<boolean>} Success status
   */
  async updateRole(id, role, tenantId, universityId = null) {
    let query = `
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `;
    const params = [role, id, tenantId];

    // Add university scoping if provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    const result = await this.db.query(query, params);
    return result.rowCount > 0;
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @param {string} tenantId - Tenant ID
   * @param {number} universityId - University ID (optional)
   * @returns {Promise<boolean>} Success status
   */
  async delete(id, tenantId, universityId = null) {
    let query = 'DELETE FROM users WHERE id = $1 AND tenant_id = $2';
    const params = [id, tenantId];

    // Add university scoping if provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    const result = await this.db.query(query, params);
    return result.rowCount > 0;
  }

  /**
   * Get all users for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {number} universityId - University ID (optional)
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} Array of users
   */
  async findAllByTenant(tenantId, universityId = null, { limit = 50, offset = 0 } = {}) {
    let query = `
      SELECT id, email, first_name, last_name, role, university_id, department, tenant_id, is_active, created_at, updated_at
      FROM users
      WHERE tenant_id = $1
    `;
    const params = [tenantId];

    // Add university scoping if provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Count staff members (non-student users) for a university
   * @param {number} universityId - University ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<number>} Count of staff members
   */
  async countStaffByUniversity(universityId, tenantId) {
    const query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE university_id = $1 AND tenant_id = $2 AND role != 'student'
    `;
    const result = await this.db.query(query, [universityId, tenantId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = UserRepository;