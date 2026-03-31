const BaseRepository = require('./BaseRepository');

class DepartmentRepository extends BaseRepository {
    constructor() {
        super('departments');
    }

    async findByFacultyId(facultyId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT d.*, f.name as faculty_name, f.code as faculty_code
            FROM ${this.tableName} d
            INNER JOIN faculties f ON d.faculty_id = f.id
            WHERE d.faculty_id = $1
        `;

        const params = [facultyId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY d.${orderBy} ${orderDirection}`;
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

    async findByCode(code, facultyId) {
        const query = `
            SELECT d.*, f.name as faculty_name, f.code as faculty_code
            FROM ${this.tableName} d
            INNER JOIN faculties f ON d.faculty_id = f.id
            WHERE d.code = $1 AND d.faculty_id = $2
        `;
        const result = await this.db.query(query, [code, facultyId]);
        return result.rows[0];
    }

    async findByUniversityId(universityId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT d.*, f.name as faculty_name, f.code as faculty_code
            FROM ${this.tableName} d
            INNER JOIN faculties f ON d.faculty_id = f.id
            WHERE f.university_id = $1
        `;

        const params = [universityId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY d.${orderBy} ${orderDirection}`;
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

    async getPrograms(departmentId) {
        const query = `
            SELECT p.* FROM programs p
            WHERE p.department_id = $1
            ORDER BY p.name ASC
        `;
        const result = await this.db.query(query, [departmentId]);
        return result.rows;
    }

    async getFaculty(departmentId) {
        const query = `
            SELECT f.* FROM faculties f
            INNER JOIN departments d ON d.faculty_id = f.id
            WHERE d.id = $1
        `;
        const result = await this.db.query(query, [departmentId]);
        return result.rows[0];
    }

    async countByFacultyId(facultyId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE faculty_id = $1
        `;
        const result = await this.db.query(query, [facultyId]);
        return parseInt(result.rows[0].count);
    }

    async countByUniversityId(universityId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName} d
            INNER JOIN faculties f ON d.faculty_id = f.id
            WHERE f.university_id = $1
        `;
        const result = await this.db.query(query, [universityId]);
        return parseInt(result.rows[0].count);
    }
}

module.exports = DepartmentRepository;