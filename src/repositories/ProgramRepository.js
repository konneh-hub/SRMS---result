const BaseRepository = require('./BaseRepository');

class ProgramRepository extends BaseRepository {
    constructor() {
        super('programs');
    }

    async findByDepartmentId(departmentId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT p.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code
            FROM ${this.tableName} p
            INNER JOIN departments d ON p.department_id = d.id
            INNER JOIN faculties f ON d.faculty_id = f.id
            WHERE p.department_id = $1
        `;

        const params = [departmentId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY p.${orderBy} ${orderDirection}`;
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

    async findByCode(code, departmentId) {
        const query = `
            SELECT p.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code
            FROM ${this.tableName} p
            INNER JOIN departments d ON p.department_id = d.id
            INNER JOIN faculties f ON d.faculty_id = f.id
            WHERE p.code = $1 AND p.department_id = $2
        `;
        const result = await this.db.query(query, [code, departmentId]);
        return result.rows[0];
    }

    async findByFacultyId(facultyId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT p.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code
            FROM ${this.tableName} p
            INNER JOIN departments d ON p.department_id = d.id
            INNER JOIN faculties f ON d.faculty_id = f.id
            WHERE d.faculty_id = $1
        `;

        const params = [facultyId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY p.${orderBy} ${orderDirection}`;
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

    async findByUniversityId(universityId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT p.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code
            FROM ${this.tableName} p
            INNER JOIN departments d ON p.department_id = d.id
            INNER JOIN faculties f ON d.faculty_id = f.id
            WHERE f.university_id = $1
        `;

        const params = [universityId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY p.${orderBy} ${orderDirection}`;
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

    async getDepartment(programId) {
        const query = `
            SELECT d.* FROM departments d
            INNER JOIN programs p ON p.department_id = d.id
            WHERE p.id = $1
        `;
        const result = await this.db.query(query, [programId]);
        return result.rows[0];
    }

    async getFaculty(programId) {
        const query = `
            SELECT f.* FROM faculties f
            INNER JOIN departments d ON d.faculty_id = f.id
            INNER JOIN programs p ON p.department_id = d.id
            WHERE p.id = $1
        `;
        const result = await this.db.query(query, [programId]);
        return result.rows[0];
    }

    async countByDepartmentId(departmentId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE department_id = $1
        `;
        const result = await this.db.query(query, [departmentId]);
        return parseInt(result.rows[0].count);
    }

    async countByFacultyId(facultyId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName} p
            INNER JOIN departments d ON p.department_id = d.id
            WHERE d.faculty_id = $1
        `;
        const result = await this.db.query(query, [facultyId]);
        return parseInt(result.rows[0].count);
    }

    async countByUniversityId(universityId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName} p
            INNER JOIN departments d ON p.department_id = d.id
            INNER JOIN faculties f ON d.faculty_id = f.id
            WHERE f.university_id = $1
        `;
        const result = await this.db.query(query, [universityId]);
        return parseInt(result.rows[0].count);
    }
}

module.exports = ProgramRepository;