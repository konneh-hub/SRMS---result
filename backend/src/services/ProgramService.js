const ProgramRepository = require('../repositories/ProgramRepository');
const DepartmentRepository = require('../repositories/DepartmentRepository');
const FacultyRepository = require('../repositories/FacultyRepository');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

class ProgramService {
    constructor() {
        this.programRepository = new ProgramRepository();
        this.departmentRepository = new DepartmentRepository();
        this.facultyRepository = new FacultyRepository();
    }

    async create(data, user) {
        // Validate required fields
        if (!data.name || !data.code || !data.departmentId) {
            throw new ValidationError('Name, code, and department ID are required');
        }

        // Check if department exists and user has access
        const department = await this.departmentRepository.findById(data.departmentId);
        if (!department) {
            throw new NotFoundError('Department not found');
        }

        // Check permissions
        const faculty = await this.facultyRepository.findById(department.faculty_id);
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only create programs in your university');
        }

        // Check if code is unique within department
        const existingProgram = await this.programRepository.findByCode(data.code, data.departmentId);
        if (existingProgram) {
            throw new ValidationError('Program code already exists in this department');
        }

        // Create program
        const programData = {
            name: data.name,
            code: data.code,
            description: data.description || null,
            program_type: data.programType || 'undergraduate',
            duration_years: data.durationYears || 4,
            credits_required: data.creditsRequired || null,
            department_id: data.departmentId,
            faculty_id: department.faculty_id, // Derived from department
            is_active: data.isActive !== undefined ? data.isActive : true,
            created_by: user.id,
            updated_by: user.id
        };

        return await this.programRepository.create(programData);
    }

    async update(id, data, user) {
        // Find existing program
        const program = await this.programRepository.findById(id);
        if (!program) {
            throw new NotFoundError('Program not found');
        }

        // Check permissions
        const department = await this.departmentRepository.findById(program.department_id);
        const faculty = await this.facultyRepository.findById(department.faculty_id);
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only update programs in your university');
        }

        // Check if code is unique within department (if being updated)
        if (data.code && data.code !== program.code) {
            const existingProgram = await this.programRepository.findByCode(data.code, program.department_id);
            if (existingProgram) {
                throw new ValidationError('Program code already exists in this department');
            }
        }

        // Update program
        const updateData = {
            ...data,
            updated_by: user.id,
            updated_at: new Date()
        };

        return await this.programRepository.update(id, updateData);
    }

    async delete(id, user) {
        // Find existing program
        const program = await this.programRepository.findById(id);
        if (!program) {
            throw new NotFoundError('Program not found');
        }

        // Check permissions
        const department = await this.departmentRepository.findById(program.department_id);
        const faculty = await this.facultyRepository.findById(department.faculty_id);
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only delete programs in your university');
        }

        // Check if program has students (would need to check students table)
        // For now, we'll allow deletion but this should be checked in a real implementation

        return await this.programRepository.delete(id);
    }

    async findById(id, user) {
        const program = await this.programRepository.findById(id);
        if (!program) {
            throw new NotFoundError('Program not found');
        }

        // Check permissions
        const department = await this.departmentRepository.findById(program.department_id);
        const faculty = await this.facultyRepository.findById(department.faculty_id);
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only view programs in your university');
        }

        return program;
    }

    async findAll(options = {}, user) {
        const { departmentId, facultyId, universityId, page = 1, limit = 10, search } = options;

        // Determine scope based on user role
        let targetDepartmentId = departmentId;
        let targetFacultyId = facultyId;
        let targetUniversityId = universityId;

        if (user.role !== 'system_admin') {
            targetUniversityId = user.universityId;
        }

        let programs;
        let total;

        if (targetDepartmentId) {
            // Get programs for specific department
            const department = await this.departmentRepository.findById(targetDepartmentId);
            if (!department) {
                throw new NotFoundError('Department not found');
            }

            const faculty = await this.facultyRepository.findById(department.faculty_id);
            if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
                throw new ForbiddenError('You can only view programs in your university');
            }

            const offset = (page - 1) * limit;
            programs = await this.programRepository.findByDepartmentId(targetDepartmentId, {
                limit,
                offset,
                orderBy: 'name',
                orderDirection: 'ASC'
            });
            total = await this.programRepository.countByDepartmentId(targetDepartmentId);
        } else if (targetFacultyId) {
            // Get programs for specific faculty
            const faculty = await this.facultyRepository.findById(targetFacultyId);
            if (!faculty) {
                throw new NotFoundError('Faculty not found');
            }

            if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
                throw new ForbiddenError('You can only view programs in your university');
            }

            const offset = (page - 1) * limit;
            programs = await this.programRepository.findByFacultyId(targetFacultyId, {
                limit,
                offset,
                orderBy: 'name',
                orderDirection: 'ASC'
            });
            total = await this.programRepository.countByFacultyId(targetFacultyId);
        } else if (targetUniversityId) {
            // Get all programs for university
            const offset = (page - 1) * limit;
            programs = await this.programRepository.findByUniversityId(targetUniversityId, {
                limit,
                offset,
                orderBy: 'name',
                orderDirection: 'ASC'
            });
            total = await this.programRepository.countByUniversityId(targetUniversityId);
        } else {
            throw new ValidationError('Department ID, Faculty ID, or University ID is required');
        }

        return {
            programs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getDepartment(programId, user) {
        // Check program access
        const program = await this.findById(programId, user);
        return await this.programRepository.getDepartment(programId);
    }

    async getFaculty(programId, user) {
        // Check program access
        const program = await this.findById(programId, user);
        return await this.programRepository.getFaculty(programId);
    }

    async getStats(programId, user) {
        // Check program access
        const program = await this.findById(programId, user);

        // In a real implementation, this would count students enrolled in the program
        return {
            programId,
            enrolledStudents: 0 // Placeholder
        };
    }
}

module.exports = ProgramService;