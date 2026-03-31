const FacultyService = require('../services/FacultyService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class FacultyController {
    constructor() {
        this.facultyService = new FacultyService();
    }

    async create(req, res) {
        try {
            const faculty = await this.facultyService.create(req.body, req.user);
            sendSuccess(res, 'Faculty created successfully', faculty, 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const faculty = await this.facultyService.update(id, req.body, req.user);
            sendSuccess(res, 'Faculty updated successfully', faculty);
        } catch (error) {
            sendError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.facultyService.delete(id, req.user);
            sendSuccess(res, 'Faculty deleted successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const faculty = await this.facultyService.findById(id, req.user);
            sendSuccess(res, 'Faculty retrieved successfully', faculty);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getAll(req, res) {
        try {
            const options = {
                universityId: req.query.universityId,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search
            };

            const result = await this.facultyService.findAll(options, req.user);
            sendSuccess(res, 'Faculties retrieved successfully', result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getDepartments(req, res) {
        try {
            const { id } = req.params;
            const departments = await this.facultyService.getDepartments(id, req.user);
            sendSuccess(res, 'Departments retrieved successfully', departments);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getPrograms(req, res) {
        try {
            const { id } = req.params;
            const programs = await this.facultyService.getPrograms(id, req.user);
            sendSuccess(res, 'Programs retrieved successfully', programs);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getStats(req, res) {
        try {
            const { id } = req.params;
            const stats = await this.facultyService.getStats(id, req.user);
            sendSuccess(res, 'Faculty stats retrieved successfully', stats);
        } catch (error) {
            sendError(res, error);
        }
    }
}

module.exports = FacultyController;