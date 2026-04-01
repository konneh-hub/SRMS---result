const BaseRepository = require('./baseRepository');
const db = require('../config/database');

class UniversityRepository extends BaseRepository {
  constructor() {
    super('universities');
    this.db = db; // Reference to database service
  }

  async findByName(name, tenantId) {
    const query = `SELECT * FROM ${this.tableName} WHERE name = $1 AND tenant_id = $2`;
    const result = await this.db.query(query, [name, tenantId], tenantId);
    return result.rows[0] || null;
  }

  async hasStudents(universityId, tenantId) {
    const query = 'SELECT COUNT(*) as count FROM students WHERE university_id = $1 AND tenant_id = $2';
    const result = await this.db.query(query, [universityId, tenantId], tenantId);
    return parseInt(result.rows[0].count) > 0;
  }

  async updateStatus(id, status, tenantId) {
    const query = `UPDATE ${this.tableName} SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *`;
    const result = await this.db.query(query, [status, id, tenantId], tenantId);
    return result.rows[0] || null;
  }

  async findByStatus(status, tenantId) {
    const query = `SELECT * FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY created_at DESC`;
    const result = await this.db.query(query, [status, tenantId], tenantId);
    return result.rows;
  }

  async getUniversityStats(tenantId) {
    const query = `
      SELECT
        COUNT(*) as total_universities,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_universities,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_universities,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_universities
      FROM ${this.tableName}
      WHERE tenant_id = $1
    `;
    const result = await this.db.query(query, [tenantId], tenantId);
    return result.rows[0];
  }
}

module.exports = new UniversityRepository();