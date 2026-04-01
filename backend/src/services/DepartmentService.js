const DepartmentRepository = require('../repositories/DepartmentRepository');
const FacultyRepository = require('../repositories/FacultyRepository');
const ProgramRepository = require('../repositories/ProgramRepository');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

class DepartmentService {
    constructor() {
        this.departmentRepository = new DepartmentRepository();
        this.facultyRepository = new FacultyRepository();
        this.programRepository = new ProgramRepository();
    }

    async create(data, user) {
        // Validate required fields
        if (!data.name || !data.code || !data.facultyId) {
            throw new ValidationError('Name, code, and faculty ID are required');
        }

        // Check if faculty exists and user has access
        const faculty = await this.facultyRepository.findById(data.facultyId);
        if (!faculty) {
            throw new NotFoundError('Faculty not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only create departments in your university');
        }

        // Check if code is unique within faculty
        const existingDepartment = await this.departmentRepository.findByCode(data.code, data.facultyId);
        if (existingDepartment) {
            throw new ValidationError('Department code already exists in this faculty');
        }

        // Create department
        const departmentData = {
            name: data.name,
            code: data.code,
            description: data.description || null,
            hod_id: data.hodId || null,
            faculty_id: data.facultyId,
            is_active: data.isActive !== undefined ? data.isActive : true,
            created_by: user.id,
            updated_by: user.id
        };

        return await this.departmentRepository.create(departmentData);
    }

    async update(id, data, user) {
        // Find existing department
        const department = await this.departmentRepository.findById(id);
        if (!department) {
            throw new NotFoundError('Department not found');
        }

        // Check permissions
        const faculty = await this.facultyRepository.findById(department.faculty_id);
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only update departments in your university');
        }

        // Check if code is unique within faculty (if being updated)
        if (data.code && data.code !== department.code) {
            const existingDepartment = await this.departmentRepository.findByCode(data.code, department.faculty_id);
            if (existingDepartment) {
                throw new ValidationError('Department code already exists in this faculty');
            }
        }

        // Update department
        const updateData = {
            ...data,
            updated_by: user.id,
            updated_at: new Date()
        };

        return await this.departmentRepository.update(id, updateData);
    }

    async delete(id, user) {
        // Find existing department
        const department = await this.departmentRepository.findById(id);
        if (!department) {
            throw new NotFoundError('Department not found');
        }

        // Check permissions
        const faculty = await this.facultyRepository.findById(department.faculty_id);
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only delete departments in your university');
        }

        // Check if department has programs
        const programsCount = await this.programRepository.countByDepartmentId(id);
        if (programsCount > 0) {
            throw new ValidationError('Cannot delete department with existing programs');
        }

        return await this.departmentRepository.delete(id);
    }

    async findById(id, user) {
        const department = await this.departmentRepository.findById(id);
        if (!department) {
            throw new NotFoundError('Department not found');
        }

        // Check permissions
        const faculty = await this.facultyRepository.findById(department.faculty_id);
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only view departments in your university');
        }

        return department;
    }

    async findAll(options = {}, user) {
        const { facultyId, universityId, page = 1, limit = 10, search } = options;

        // Determine scope based on user role
        let targetFacultyId = facultyId;
        let targetUniversityId = universityId;

        if (user.role !== 'system_admin') {
            targetUniversityId = user.universityId;
        }

        let departments;
        let total;

        if (targetFacultyId) {
            // Get departments for specific faculty
            const faculty = await this.facultyRepository.findById(targetFacultyId);
            if (!faculty) {
                throw new NotFoundError('Faculty not found');
            }

            if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
                throw new ForbiddenError('You can only view departments in your university');
            }

            const offset = (page - 1) * limit;
            departments = await this.departmentRepository.findByFacultyId(targetFacultyId, {
                limit,
                offset,
                orderBy: 'name',
                orderDirection: 'ASC'
            });
            total = await this.departmentRepository.countByFacultyId(targetFacultyId);
        } else if (targetUniversityId) {
            // Get all departments for university
            const offset = (page - 1) * limit;
            departments = await this.departmentRepository.findByUniversityId(targetUniversityId, {
                limit,
                offset,
                orderBy: 'name',
                orderDirection: 'ASC'
            });
            total = await this.departmentRepository.countByUniversityId(targetUniversityId);
        } else {
            throw new ValidationError('Faculty ID or University ID is required');
        }

        return {
            departments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getPrograms(departmentId, user) {
        // Check department access
        const department = await this.findById(departmentId, user);
        return await this.departmentRepository.getPrograms(departmentId);
    }

    async getFaculty(departmentId, user) {
        // Check department access
        const department = await this.findById(departmentId, user);
        return await this.departmentRepository.getFaculty(departmentId);
    }

    async getStats(departmentId, user) {
        // Check department access
        const department = await this.findById(departmentId, user);

        const programsCount = await this.programRepository.countByDepartmentId(departmentId);

        return {
            departmentId,
            programsCount
        };
    }
}

module.exports = DepartmentService;