const DepartmentService = require('../services/DepartmentService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class DepartmentController {
    constructor() {
        this.departmentService = new DepartmentService();
    }

    async create(req, res) {
        try {
            const department = await this.departmentService.create(req.body, req.user);
            sendSuccess(res, 'Department created successfully', department, 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const department = await this.departmentService.update(id, req.body, req.user);
            sendSuccess(res, 'Department updated successfully', department);
        } catch (error) {
            sendError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.departmentService.delete(id, req.user);
            sendSuccess(res, 'Department deleted successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const department = await this.departmentService.findById(id, req.user);
            sendSuccess(res, 'Department retrieved successfully', department);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getAll(req, res) {
        try {
            const options = {
                facultyId: req.query.facultyId,
                universityId: req.query.universityId,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search
            };

            const result = await this.departmentService.findAll(options, req.user);
            sendSuccess(res, 'Departments retrieved successfully', result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getPrograms(req, res) {
        try {
            const { id } = req.params;
            const programs = await this.departmentService.getPrograms(id, req.user);
            sendSuccess(res, 'Programs retrieved successfully', programs);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getFaculty(req, res) {
        try {
            const { id } = req.params;
            const faculty = await this.departmentService.getFaculty(id, req.user);
            sendSuccess(res, 'Faculty retrieved successfully', faculty);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getStats(req, res) {
        try {
            const { id } = req.params;
            const stats = await this.departmentService.getStats(id, req.user);
            sendSuccess(res, 'Department stats retrieved successfully', stats);
        } catch (error) {
            sendError(res, error);
        }
    }
}

module.exports = DepartmentController;