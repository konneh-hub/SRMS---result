const StaffService = require('../services/StaffService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class StaffController {
    constructor() {
        this.staffService = new StaffService();
    }

    async create(req, res) {
        try {
            const staff = await this.staffService.create(req.body, req.user);
            sendSuccess(res, 'Staff member created successfully', staff, 201);
        } catch (error) {
            sendError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const staff = await this.staffService.update(id, req.body, req.user);
            sendSuccess(res, 'Staff member updated successfully', staff);
        } catch (error) {
            sendError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.staffService.delete(id, req.user);
            sendSuccess(res, 'Staff member deleted successfully');
        } catch (error) {
            sendError(res, error);
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const staff = await this.staffService.findById(id, req.user);
            sendSuccess(res, 'Staff member retrieved successfully', staff);
        } catch (error) {
            sendError(res, error);
        }
    }

    async getAll(req, res) {
        try {
            const options = {
                universityId: req.query.universityId,
                facultyId: req.query.facultyId,
                departmentId: req.query.departmentId,
                role: req.query.role,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            };

            const result = await this.staffService.findAll(options, req.user);
            sendSuccess(res, 'Staff members retrieved successfully', result);
        } catch (error) {
            sendError(res, error);
        }
    }

    async assignRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!role) {
                return sendError(res, 'Role is required', 400);
            }

            const staff = await this.staffService.assignRole(id, role, req.user);
            sendSuccess(res, 'Role assigned successfully', staff);
        } catch (error) {
            sendError(res, error);
        }
    }

    async assignDepartment(req, res) {
        try {
            const { id } = req.params;
            const { departmentId } = req.body;

            if (!departmentId) {
                return sendError(res, 'Department ID is required', 400);
            }

            const staff = await this.staffService.assignDepartment(id, departmentId, req.user);
            sendSuccess(res, 'Department assigned successfully', staff);
        } catch (error) {
            sendError(res, error);
        }
    }

    async bulkUpload(req, res) {
        try {
            const { staff } = req.body;

            if (!Array.isArray(staff) || staff.length === 0) {
                return sendError(res, 'Staff array is required and must not be empty', 400);
            }

            if (staff.length > 500) {
                return sendError(res, 'Maximum 500 staff members can be uploaded at once', 400);
            }

            const results = await this.staffService.bulkUpload(staff, req.user);
            sendSuccess(res, 'Bulk upload completed', {
                successful_count: results.successful.length,
                failed_count: results.failed.length,
                successful: results.successful,
                failed: results.failed
            });
        } catch (error) {
            sendError(res, error);
        }
    }

    async getStats(req, res) {
        try {
            const { universityId } = req.params;
            const stats = await this.staffService.getStats(universityId, req.user);
            sendSuccess(res, 'Staff statistics retrieved successfully', stats);
        } catch (error) {
            sendError(res, error);
        }
    }
}

module.exports = StaffController;