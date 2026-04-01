const BaseRepository = require('./BaseRepository');

class FacultyRepository extends BaseRepository {
    constructor() {
        super('faculties');
    }

    async findByUniversityId(universityId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT * FROM ${this.tableName}
            WHERE university_id = $1
        `;

        const params = [universityId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY ${orderBy} ${orderDirection}`;
        }

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(limit);
            paramIndex++;
        }

        if (offset) {
            query += ` OFFSET $${paramIndex}`;
            params.push(offset);
        }

        const result = await this.db.query(query, params);
        return result.rows;
    }

    async findByCode(code, universityId) {
        const query = `
            SELECT * FROM ${this.tableName}
            WHERE code = $1 AND university_id = $2
        `;
        const result = await this.db.query(query, [code, universityId]);
        return result.rows[0];
    }

    async getDepartments(facultyId) {
        const query = `
            SELECT d.* FROM departments d
            WHERE d.faculty_id = $1
            ORDER BY d.name ASC
        `;
        const result = await this.db.query(query, [facultyId]);
        return result.rows;
    }

    async getPrograms(facultyId) {
        const query = `
            SELECT p.* FROM programs p
            INNER JOIN departments d ON p.department_id = d.id
            WHERE d.faculty_id = $1
            ORDER BY p.name ASC
        `;
        const result = await this.db.query(query, [facultyId]);
        return result.rows;
    }

    async countByUniversityId(universityId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE university_id = $1
        `;
        const result = await this.db.query(query, [universityId]);
        return parseInt(result.rows[0].count);
    }
}

module.exports = FacultyRepository;