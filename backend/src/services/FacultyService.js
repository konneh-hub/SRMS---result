const FacultyRepository = require('../repositories/FacultyRepository');
const DepartmentRepository = require('../repositories/DepartmentRepository');
const ProgramRepository = require('../repositories/ProgramRepository');
const UniversityRepository = require('../repositories/UniversityRepository');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

class FacultyService {
    constructor() {
        this.facultyRepository = new FacultyRepository();
        this.departmentRepository = new DepartmentRepository();
        this.programRepository = new ProgramRepository();
        this.universityRepository = new UniversityRepository();
    }

    async create(data, user) {
        // Validate required fields
        if (!data.name || !data.code || !data.universityId) {
            throw new ValidationError('Name, code, and university ID are required');
        }

        // Check if university exists and user has access
        const university = await this.universityRepository.findById(data.universityId);
        if (!university) {
            throw new NotFoundError('University not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== data.universityId) {
            throw new ForbiddenError('You can only create faculties for your university');
        }

        // Check if code is unique within university
        const existingFaculty = await this.facultyRepository.findByCode(data.code, data.universityId);
        if (existingFaculty) {
            throw new ValidationError('Faculty code already exists in this university');
        }

        // Create faculty
        const facultyData = {
            name: data.name,
            code: data.code,
            description: data.description || null,
            dean_id: data.deanId || null,
            university_id: data.universityId,
            is_active: data.isActive !== undefined ? data.isActive : true,
            created_by: user.id,
            updated_by: user.id
        };

        return await this.facultyRepository.create(facultyData);
    }

    async update(id, data, user) {
        // Find existing faculty
        const faculty = await this.facultyRepository.findById(id);
        if (!faculty) {
            throw new NotFoundError('Faculty not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only update faculties in your university');
        }

        // Check if code is unique within university (if being updated)
        if (data.code && data.code !== faculty.code) {
            const existingFaculty = await this.facultyRepository.findByCode(data.code, faculty.university_id);
            if (existingFaculty) {
                throw new ValidationError('Faculty code already exists in this university');
            }
        }

        // Update faculty
        const updateData = {
            ...data,
            updated_by: user.id,
            updated_at: new Date()
        };

        return await this.facultyRepository.update(id, updateData);
    }

    async delete(id, user) {
        // Find existing faculty
        const faculty = await this.facultyRepository.findById(id);
        if (!faculty) {
            throw new NotFoundError('Faculty not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only delete faculties in your university');
        }

        // Check if faculty has departments
        const departmentsCount = await this.departmentRepository.countByFacultyId(id);
        if (departmentsCount > 0) {
            throw new ValidationError('Cannot delete faculty with existing departments');
        }

        return await this.facultyRepository.delete(id);
    }

    async findById(id, user) {
        const faculty = await this.facultyRepository.findById(id);
        if (!faculty) {
            throw new NotFoundError('Faculty not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only view faculties in your university');
        }

        return faculty;
    }

    async findAll(options = {}, user) {
        const { universityId, page = 1, limit = 10, search } = options;

        // Determine university scope based on user role
        let targetUniversityId = universityId;
        if (user.role !== 'system_admin') {
            targetUniversityId = user.universityId;
        }

        if (!targetUniversityId) {
            throw new ValidationError('University ID is required for non-system admins');
        }

        const offset = (page - 1) * limit;
        const faculties = await this.facultyRepository.findByUniversityId(targetUniversityId, {
            limit,
            offset,
            orderBy: 'name',
            orderDirection: 'ASC'
        });

        const total = await this.facultyRepository.countByUniversityId(targetUniversityId);

        return {
            faculties,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getDepartments(facultyId, user) {
        // Check faculty access
        const faculty = await this.findById(facultyId, user);
        return await this.facultyRepository.getDepartments(facultyId);
    }

    async getPrograms(facultyId, user) {
        // Check faculty access
        const faculty = await this.findById(facultyId, user);
        return await this.facultyRepository.getPrograms(facultyId);
    }

    async getStats(facultyId, user) {
        // Check faculty access
        const faculty = await this.findById(facultyId, user);

        const [departmentsCount, programsCount] = await Promise.all([
            this.departmentRepository.countByFacultyId(facultyId),
            this.programRepository.countByFacultyId(facultyId)
        ]);

        return {
            facultyId,
            departmentsCount,
            programsCount
        };
    }
}

module.exports = FacultyService;