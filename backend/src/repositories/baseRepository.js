const db = require('../config/database');

// Base Repository Class
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  async findAll(tenantId, universityId = null, options = {}) {
    const { limit, offset, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    let query = `SELECT * FROM ${this.tableName} WHERE tenant_id = $1`;
    const params = [tenantId];

    // Add university scoping if universityId is provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy} ${orderDirection}`;
    }

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    if (offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }

    const result = await db.query(query, params, tenantId);
    return result.rows;
  }

  async findById(id, tenantId, universityId = null) {
    let query = `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`;
    const params = [id, tenantId];

    // Add university scoping if universityId is provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    const result = await db.query(query, params, tenantId);
    return result.rows[0] || null;
  }

  async create(data, tenantId, universityId = null) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

    let query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')}, tenant_id, created_at, updated_at)
      VALUES (${placeholders}, $${keys.length + 1}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const params = [...values, tenantId];

    // Add university_id if provided
    if (universityId) {
      query = query.replace('tenant_id, created_at, updated_at', 'tenant_id, university_id, created_at, updated_at');
      query = query.replace(`$${keys.length + 1}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP`, `$${keys.length + 1}, $${keys.length + 2}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP`);
      params.push(universityId);
    }

    query += ' RETURNING *';

    const result = await db.query(query, params, tenantId);
    return result.rows[0];
  }

  async update(id, data, tenantId, universityId = null) {
    const keys = Object.keys(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(data);

    let query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1} AND tenant_id = $${keys.length + 2}
    `;

    const params = [...values, id, tenantId];

    // Add university scoping if provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    query += ' RETURNING *';

    const result = await db.query(query, params, tenantId);
    return result.rows[0] || null;
  }

  async delete(id, tenantId, universityId = null) {
    let query = `DELETE FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`;
    const params = [id, tenantId];

    // Add university scoping if provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    query += ' RETURNING *';

    const result = await db.query(query, params, tenantId);
    return result.rows[0] || null;
  }

  async count(tenantId, universityId = null, conditions = {}) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tenant_id = $1`;
    const params = [tenantId];

    // Add university scoping if provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    Object.entries(conditions).forEach(([key, value]) => {
      query += ` AND ${key} = $${params.length + 1}`;
      params.push(value);
    });

    const result = await db.query(query, params, tenantId);
    return parseInt(result.rows[0].count);
  }

  async exists(id, tenantId, universityId = null) {
    let query = `SELECT 1 FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`;
    const params = [id, tenantId];

    // Add university scoping if provided
    if (universityId) {
      query += ` AND university_id = $${params.length + 1}`;
      params.push(universityId);
    }

    query += ' LIMIT 1';

    const result = await db.query(query, params, tenantId);
    return result.rows.length > 0;
  }
}

module.exports = BaseRepository;