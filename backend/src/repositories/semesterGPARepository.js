const BaseRepository = require('./baseRepository');

class SemesterGPARepository extends BaseRepository {
    constructor() {
        super('semester_gpas');
    }

    async findByStudent(studentId, options = {}) {
        const { semester, academicYear, limit, offset, orderBy = 'academic_year', orderDirection = 'DESC' } = options;

        let query = `
            SELECT sg.*,
                   u.name as university_name
            FROM ${this.tableName} sg
            LEFT JOIN universities u ON sg.university_id = u.id
            WHERE sg.student_id = $1
        `;

        const params = [studentId];
        let paramIndex = 2;

        if (semester) {
            query += ` AND sg.semester = $${paramIndex}`;
            params.push(semester);
            paramIndex++;
        }

        if (academicYear) {
            query += ` AND sg.academic_year = $${paramIndex}`;
            params.push(academicYear);
            paramIndex++;
        }

        query += ` ORDER BY sg.${orderBy} ${orderDirection}, sg.semester`;

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

    async findByStudentAndSemester(studentId, semester, academicYear) {
        const query = `
            SELECT sg.*,
                   u.name as university_name
            FROM ${this.tableName} sg
            LEFT JOIN universities u ON sg.university_id = u.id
            WHERE sg.student_id = $1 AND sg.semester = $2 AND sg.academic_year = $3
        `;
        const result = await this.db.query(query, [studentId, semester, academicYear]);
        return result.rows[0];
    }

    async upsertSemesterGPA(gpaData) {
        const query = `
            INSERT INTO ${this.tableName} (
                student_id, university_id, semester, academic_year,
                gpa, total_credits, courses_count, grade_distribution, tenant_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (student_id, semester, academic_year)
            DO UPDATE SET
                gpa = EXCLUDED.gpa,
                total_credits = EXCLUDED.total_credits,
                courses_count = EXCLUDED.courses_count,
                grade_distribution = EXCLUDED.grade_distribution,
                calculated_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const params = [
            gpaData.studentId,
            gpaData.universityId,
            gpaData.semester,
            gpaData.academicYear,
            gpaData.gpa,
            gpaData.totalCredits,
            gpaData.coursesCount,
            JSON.stringify(gpaData.gradeDistribution || {}),
            gpaData.tenantId
        ];

        const result = await this.db.query(query, params);
        return result.rows[0];
    }

    async getStudentCGPAData(studentId) {
        const query = `
            SELECT
                SUM(gpa * total_credits) as weighted_gpa_sum,
                SUM(total_credits) as total_credits,
                COUNT(*) as semesters_count,
                AVG(gpa) as average_gpa
            FROM ${this.tableName}
            WHERE student_id = $1
        `;
        const result = await this.db.query(query, [studentId]);
        return result.rows[0];
    }

    async getSemesterStats(universityId, semester, academicYear) {
        const query = `
            SELECT
                COUNT(*) as total_students,
                AVG(gpa) as average_gpa,
                MIN(gpa) as min_gpa,
                MAX(gpa) as max_gpa,
                SUM(total_credits) as total_credits_earned
            FROM ${this.tableName}
            WHERE university_id = $1 AND semester = $2 AND academic_year = $3
        `;
        const result = await this.db.query(query, [universityId, semester, academicYear]);
        return result.rows[0];
    }
}

module.exports = new SemesterGPARepository();