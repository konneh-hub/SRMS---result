const express = require('express');
const router = express.Router();
const gradingScaleController = require('../controllers/gradingScaleController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { AppError } = require('../utils/helpers');
const { gradingScaleRateLimit } = require('../middleware/security');

// Apply rate limiting to all grading scale routes
router.use(gradingScaleRateLimit);

// Validation schemas
const createGradingScaleSchema = {
    body: {
        name: 'string|required',
        description: 'string|optional',
        details: 'array|required',
        'details.*.grade': 'string|required',
        'details.*.gradePoint': 'number|required',
        'details.*.minScore': 'number|required',
        'details.*.maxScore': 'number|required',
        'details.*.description': 'string|optional'
    }
};

const updateGradingScaleSchema = {
    body: {
        name: 'string|optional',
        description: 'string|optional',
        isActive: 'boolean|optional',
        details: 'array|optional',
        'details.*.grade': 'string|required',
        'details.*.gradePoint': 'number|required',
        'details.*.minScore': 'number|required',
        'details.*.maxScore': 'number|required',
        'details.*.description': 'string|optional'
    }
};

// Routes

/**
 * @route GET /api/grading-scales
 * @desc Get grading scales for university
 * @access Private (Admin, Staff)
 */
router.get('/', authenticate, authorize(['admin', 'staff']), gradingScaleController.getGradingScales);

/**
 * @route GET /api/grading-scales/active
 * @desc Get active grading scale for university
 * @access Private (Admin, Staff, Student)
 */
router.get('/active', authenticate, authorize(['admin', 'staff', 'student']), gradingScaleController.getActiveGradingScale);

/**
 * @route POST /api/grading-scales
 * @desc Create new grading scale
 * @access Private (Admin only)
 */
router.post('/', authenticate, authorize(['admin']), validateRequest(createGradingScaleSchema), gradingScaleController.createGradingScale);

/**
 * @route PUT /api/grading-scales/:id
 * @desc Update grading scale
 * @access Private (Admin only)
 */
router.put('/:id', authenticate, authorize(['admin']), validateRequest(updateGradingScaleSchema), gradingScaleController.updateGradingScale);

/**
 * @route PATCH /api/grading-scales/:id/activate
 * @desc Activate grading scale
 * @access Private (Admin only)
 */
router.patch('/:id/activate', authenticate, authorize(['admin']), gradingScaleController.activateGradingScale);

/**
 * @route PATCH /api/grading-scales/:id/deactivate
 * @desc Deactivate grading scale
 * @access Private (Admin only)
 */
router.patch('/:id/deactivate', authenticate, authorize(['admin']), gradingScaleController.deactivateGradingScale);

/**
 * @route DELETE /api/grading-scales/:id
 * @desc Delete grading scale
 * @access Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), gradingScaleController.deleteGradingScale);

/**
 * @route POST /api/grading-scales/initialize-default
 * @desc Initialize default Nigerian grading scale for university
 * @access Private (Admin only)
 */
router.post('/initialize-default', authenticate, authorize(['admin']), gradingScaleController.initializeDefaultScale);

module.exports = router;