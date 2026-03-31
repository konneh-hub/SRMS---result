const ProgramService = require('../services/ProgramService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class ProgramController {
    constructor() {
        this.programService = new ProgramService();
    }

    async create(req, res) {
        try {
            const program = await this.programService.create(req.body, req.user);
            sendSuccess(res, 'Program created successfully', program, 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const program = await this.programService.update(id, req.body, req.user);
            sendSuccess(res, 'Program updated successfully', program);
        } catch (error) {
            sendError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.programService.delete(id, req.user);
            sendSuccess(res, 'Program deleted successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const program = await this.programService.findById(id, req.user);
            sendSuccess(res, 'Program retrieved successfully', program);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getAll(req, res) {
        try {
            const options = {
                departmentId: req.query.departmentId,
                facultyId: req.query.facultyId,
                universityId: req.query.universityId,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search
            };

            const result = await this.programService.findAll(options, req.user);
            sendSuccess(res, 'Programs retrieved successfully', result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getDepartment(req, res) {
        try {
            const { id } = req.params;
            const department = await this.programService.getDepartment(id, req.user);
            sendSuccess(res, 'Department retrieved successfully', department);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getFaculty(req, res) {
        try {
            const { id } = req.params;
            const faculty = await this.programService.getFaculty(id, req.user);
            sendSuccess(res, 'Faculty retrieved successfully', faculty);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getStats(req, res) {
        try {
            const { id } = req.params;
            const stats = await this.programService.getStats(id, req.user);
            sendSuccess(res, 'Program stats retrieved successfully', stats);
        } catch (error) {
            sendError(res, error);
        }
    }
}

module.exports = ProgramController;