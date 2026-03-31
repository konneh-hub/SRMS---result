const CourseService = require('../services/CourseService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class CourseController {
    constructor() {
        this.courseService = new CourseService();
    }

    async create(req, res) {
        try {
            const course = await this.courseService.create(req.body, req.user);
            sendSuccess(res, 'Course created successfully', course, 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const course = await this.courseService.update(id, req.body, req.user);
            sendSuccess(res, 'Course updated successfully', course);
        } catch (error) {
            sendError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.courseService.delete(id, req.user);
            sendSuccess(res, 'Course deleted successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const course = await this.courseService.findById(id, req.user);
            sendSuccess(res, 'Course retrieved successfully', course);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getAll(req, res) {
        try {
            const options = {
                departmentId: req.query.departmentId,
                facultyId: req.query.facultyId,
                lecturerId: req.query.lecturerId,
                universityId: req.query.universityId,
                semester: req.query.semester,
                year: req.query.year ? parseInt(req.query.year) : undefined,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            };

            const result = await this.courseService.findAll(options, req.user);
            sendSuccess(res, 'Courses retrieved successfully', result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async assignLecturer(req, res) {
        try {
            const { id } = req.params;
            const { lecturerId } = req.body;

            if (!lecturerId) {
                return sendError(res, { message: 'Lecturer ID is required' }, 400);
            }

            const course = await this.courseService.assignLecturer(id, lecturerId, req.user);
            sendSuccess(res, 'Lecturer assigned to course successfully', course);
        } catch (error) {
            sendError(res, error);
        }
    }

    async removeLecturer(req, res) {
        try {
            const { id } = req.params;
            const course = await this.courseService.removeLecturer(id, req.user);
            sendSuccess(res, 'Lecturer removed from course successfully', course);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getLecturer(req, res) {
        try {
            const { id } = req.params;
            const lecturer = await this.courseService.getLecturer(id, req.user);
            sendSuccess(res, 'Course lecturer retrieved successfully', lecturer);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getDepartment(req, res) {
        try {
            const { id } = req.params;
            const department = await this.courseService.getDepartment(id, req.user);
            sendSuccess(res, 'Course department retrieved successfully', department);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getFaculty(req, res) {
        try {
            const { id } = req.params;
            const faculty = await this.courseService.getFaculty(id, req.user);
            sendSuccess(res, 'Course faculty retrieved successfully', faculty);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getAvailableCourses(req, res) {
        try {
            const options = {
                universityId: req.query.universityId,
                semester: req.query.semester,
                year: req.query.year ? parseInt(req.query.year) : undefined,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            };

            const result = await this.courseService.getAvailableCourses(options, req.user);
            sendSuccess(res, 'Available courses retrieved successfully', result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getStats(req, res) {
        try {
            const { id } = req.params;
            const stats = await this.courseService.getStats(id, req.user);
            sendSuccess(res, 'Course stats retrieved successfully', stats);
        } catch (error) {
            sendError(res, error);
        }
    }
}

module.exports = CourseController;