const gradingScaleRepository = require('../repositories/gradingScaleRepository');
const { AppError } = require('../utils/helpers');

class GradingScaleService {
    /**
     * Create a new grading scale for a university
     * @param {Object} scaleData - Grading scale data
     * @param {Array} detailsData - Grading scale details
     * @returns {Object} Created grading scale
     */
    async createGradingScale(scaleData, detailsData) {
        const { universityId, name, description, tenantId } = scaleData;

        // Validate details data
        this.validateGradingScaleDetails(detailsData);

        // Check if university already has an active scale
        const existingScale = await gradingScaleRepository.getActiveScaleForUniversity(universityId);
        if (existingScale) {
            throw new AppError('University already has an active grading scale. Deactivate it first.', 400);
        }

        const scale = await gradingScaleRepository.createWithDetails(
            {
                university_id: universityId,
                name,
                description,
                is_active: true,
                tenant_id: tenantId
            },
            detailsData.map(detail => ({
                grade: detail.grade,
                grade_point: detail.gradePoint,
                min_score: detail.minScore,
                max_score: detail.maxScore,
                description: detail.description
            }))
        );

        return scale;
    }

    /**
     * Get grading scales for a university
     * @param {number} universityId - University ID
     * @param {Object} options - Query options
     * @returns {Array} Grading scales
     */
    async getGradingScales(universityId, options = {}) {
        return await gradingScaleRepository.findByUniversity(universityId, options);
    }

    /**
     * Get active grading scale for a university
     * @param {number} universityId - University ID
     * @returns {Object} Active grading scale
     */
    async getActiveGradingScale(universityId) {
        const scale = await gradingScaleRepository.getActiveScaleForUniversity(universityId);
        if (!scale) {
            throw new AppError('No active grading scale found for this university', 404);
        }
        return scale;
    }

    /**
     * Update grading scale
     * @param {number} scaleId - Grading scale ID
     * @param {Object} updateData - Update data
     * @param {Array} detailsData - New details data (optional)
     * @returns {Object} Updated grading scale
     */
    async updateGradingScale(scaleId, updateData, detailsData = null) {
        // If updating details, validate them
        if (detailsData) {
            this.validateGradingScaleDetails(detailsData);
        }

        // Update the scale
        const updatedScale = await gradingScaleRepository.update(scaleId, updateData);

        // If details provided, update them too
        if (detailsData) {
            // Delete existing details
            await gradingScaleRepository.db.query(
                'DELETE FROM grading_scale_details WHERE grading_scale_id = $1',
                [scaleId]
            );

            // Insert new details
            for (const detail of detailsData) {
                await gradingScaleRepository.db.query(`
                    INSERT INTO grading_scale_details (
                        grading_scale_id, grade, grade_point, min_score, max_score, description, tenant_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    scaleId,
                    detail.grade,
                    detail.gradePoint,
                    detail.minScore,
                    detail.maxScore,
                    detail.description,
                    updatedScale.tenant_id
                ]);
            }
        }

        return updatedScale;
    }

    /**
     * Activate a grading scale (deactivate others for the university)
     * @param {number} scaleId - Grading scale ID
     * @returns {Object} Activated grading scale
     */
    async activateGradingScale(scaleId) {
        const scale = await gradingScaleRepository.findById(scaleId);
        if (!scale) {
            throw new AppError('Grading scale not found', 404);
        }

        // Deactivate all scales for this university
        await gradingScaleRepository.db.query(
            'UPDATE grading_scales SET is_active = false WHERE university_id = $1',
            [scale.university_id]
        );

        // Activate this scale
        return await gradingScaleRepository.update(scaleId, { is_active: true });
    }

    /**
     * Deactivate a grading scale
     * @param {number} scaleId - Grading scale ID
     * @returns {Object} Deactivated grading scale
     */
    async deactivateGradingScale(scaleId) {
        return await gradingScaleRepository.update(scaleId, { is_active: false });
    }

    /**
     * Delete a grading scale
     * @param {number} scaleId - Grading scale ID
     * @returns {boolean} Success status
     */
    async deleteGradingScale(scaleId) {
        const scale = await gradingScaleRepository.findById(scaleId);
        if (!scale) {
            throw new AppError('Grading scale not found', 404);
        }

        if (scale.is_active) {
            throw new AppError('Cannot delete an active grading scale. Deactivate it first.', 400);
        }

        await gradingScaleRepository.delete(scaleId);
        return true;
    }

    /**
     * Get default Nigerian grading scale
     * @returns {Object} Default grading scale
     */
    getDefaultNigerianScale() {
        return {
            name: 'Default Nigerian Scale',
            description: 'Standard Nigerian university grading scale',
            details: [
                { grade: 'A', gradePoint: 5.0, minScore: 70, maxScore: 100, description: 'Excellent' },
                { grade: 'B', gradePoint: 4.0, minScore: 60, maxScore: 69, description: 'Very Good' },
                { grade: 'C', gradePoint: 3.0, minScore: 50, maxScore: 59, description: 'Good' },
                { grade: 'D', gradePoint: 2.0, minScore: 45, maxScore: 49, description: 'Fair' },
                { grade: 'E', gradePoint: 1.0, minScore: 40, maxScore: 44, description: 'Pass' },
                { grade: 'F', gradePoint: 0.0, minScore: 0, maxScore: 39, description: 'Fail' }
            ]
        };
    }

    /**
     * Validate grading scale details
     * @param {Array} details - Grading scale details
     * @throws {AppError} If validation fails
     */
    validateGradingScaleDetails(details) {
        if (!Array.isArray(details) || details.length === 0) {
            throw new AppError('Grading scale must have at least one grade detail', 400);
        }

        const grades = new Set();
        let previousMaxScore = -1;

        for (const detail of details) {
            // Check required fields
            if (!detail.grade || typeof detail.gradePoint !== 'number' ||
                typeof detail.minScore !== 'number' || typeof detail.maxScore !== 'number') {
                throw new AppError('Each grade detail must have grade, gradePoint, minScore, and maxScore', 400);
            }

            // Check grade uniqueness
            if (grades.has(detail.grade)) {
                throw new AppError(`Duplicate grade: ${detail.grade}`, 400);
            }
            grades.add(detail.grade);

            // Check score ranges
            if (detail.minScore > detail.maxScore) {
                throw new AppError(`Invalid score range for grade ${detail.grade}: min > max`, 400);
            }

            // Check for gaps or overlaps
            if (detail.minScore !== previousMaxScore + 1 && previousMaxScore !== -1) {
                throw new AppError('Grading scale score ranges must be contiguous', 400);
            }

            previousMaxScore = detail.maxScore;

            // Validate grade points
            if (detail.gradePoint < 0 || detail.gradePoint > 5.0) {
                throw new AppError(`Grade point for ${detail.grade} must be between 0 and 5.0`, 400);
            }
        }

        // Check if ranges cover from 0 to 100
        const minScore = Math.min(...details.map(d => d.minScore));
        const maxScore = Math.max(...details.map(d => d.maxScore));

        if (minScore > 0) {
            throw new AppError('Grading scale must cover scores from 0', 400);
        }

        if (maxScore < 100) {
            throw new AppError('Grading scale must cover scores up to 100', 400);
        }
    }

    /**
     * Initialize default grading scale for a university
     * @param {number} universityId - University ID
     * @param {string} tenantId - Tenant ID
     * @returns {Object} Created grading scale
     */
    async initializeDefaultScale(universityId, tenantId) {
        const defaultScale = this.getDefaultNigerianScale();

        return await this.createGradingScale(
            {
                universityId,
                name: defaultScale.name,
                description: defaultScale.description,
                tenantId
            },
            defaultScale.details
        );
    }
}

module.exports = new GradingScaleService();