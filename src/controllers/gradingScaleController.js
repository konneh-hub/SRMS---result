const gradingScaleService = require('../services/gradingScaleService');
const { AppError } = require('../utils/helpers');

class GradingScaleController {
    /**
     * Get grading scales for university
     */
    async getGradingScales(req, res, next) {
        try {
            const { universityId } = req.user;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                includeInactive: req.query.includeInactive === 'true'
            };

            const scales = await gradingScaleService.getGradingScales(universityId, options);

            res.json({
                success: true,
                data: scales,
                pagination: {
                    page: options.page,
                    limit: options.limit
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get active grading scale for university
     */
    async getActiveGradingScale(req, res, next) {
        try {
            const { universityId } = req.user;
            const scale = await gradingScaleService.getActiveGradingScale(universityId);

            res.json({
                success: true,
                data: scale
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new grading scale
     */
    async createGradingScale(req, res, next) {
        try {
            const { universityId, tenantId } = req.user;
            const { name, description, details } = req.body;

            const scale = await gradingScaleService.createGradingScale(
                { universityId, name, description, tenantId },
                details
            );

            res.status(201).json({
                success: true,
                message: 'Grading scale created successfully',
                data: scale
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update grading scale
     */
    async updateGradingScale(req, res, next) {
        try {
            const { id } = req.params;
            const { name, description, isActive, details } = req.body;

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (isActive !== undefined) updateData.is_active = isActive;

            const scale = await gradingScaleService.updateGradingScale(id, updateData, details);

            res.json({
                success: true,
                message: 'Grading scale updated successfully',
                data: scale
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Activate grading scale
     */
    async activateGradingScale(req, res, next) {
        try {
            const { id } = req.params;
            const scale = await gradingScaleService.activateGradingScale(id);

            res.json({
                success: true,
                message: 'Grading scale activated successfully',
                data: scale
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Deactivate grading scale
     */
    async deactivateGradingScale(req, res, next) {
        try {
            const { id } = req.params;
            const scale = await gradingScaleService.deactivateGradingScale(id);

            res.json({
                success: true,
                message: 'Grading scale deactivated successfully',
                data: scale
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete grading scale
     */
    async deleteGradingScale(req, res, next) {
        try {
            const { id } = req.params;
            await gradingScaleService.deleteGradingScale(id);

            res.json({
                success: true,
                message: 'Grading scale deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Initialize default grading scale
     */
    async initializeDefaultScale(req, res, next) {
        try {
            const { universityId, tenantId } = req.user;
            const scale = await gradingScaleService.initializeDefaultScale(universityId, tenantId);

            res.status(201).json({
                success: true,
                message: 'Default grading scale initialized successfully',
                data: scale
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new GradingScaleController();