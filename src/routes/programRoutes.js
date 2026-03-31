const express = require('express');
const ProgramController = require('../controllers/ProgramController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { programRateLimit } = require('../middleware/security');

const router = express.Router();
const programController = new ProgramController();

// Apply rate limiting to all program routes
router.use(programRateLimit);

// Validation schemas
const createProgramSchema = {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    code: { type: 'string', required: true, minLength: 1, maxLength: 20 },
    description: { type: 'string', required: false, maxLength: 500 },
    programType: { type: 'string', required: false, enum: ['undergraduate', 'graduate', 'diploma', 'certificate'] },
    durationYears: { type: 'number', required: false, minimum: 1, maximum: 10 },
    creditsRequired: { type: 'number', required: false, minimum: 1 },
    departmentId: { type: 'string', required: true, format: 'uuid' },
    isActive: { type: 'boolean', required: false }
};

const updateProgramSchema = {
    name: { type: 'string', required: false, minLength: 1, maxLength: 100 },
    code: { type: 'string', required: false, minLength: 1, maxLength: 20 },
    description: { type: 'string', required: false, maxLength: 500 },
    programType: { type: 'string', required: false, enum: ['undergraduate', 'graduate', 'diploma', 'certificate'] },
    durationYears: { type: 'number', required: false, minimum: 1, maximum: 10 },
    creditsRequired: { type: 'number', required: false, minimum: 1 },
    isActive: { type: 'boolean', required: false }
};

// Routes
router.post('/',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod']),
    validateRequest(createProgramSchema),
    programController.create.bind(programController)
);

router.put('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod', 'exam_officer']),
    validateRequest(updateProgramSchema),
    programController.update.bind(programController)
);

router.delete('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod']),
    programController.delete.bind(programController)
);

router.get('/:id',
    authenticate,
    programController.getById.bind(programController)
);

router.get('/',
    authenticate,
    programController.getAll.bind(programController)
);

// Relationship routes
router.get('/:id/department',
    authenticate,
    programController.getDepartment.bind(programController)
);

router.get('/:id/faculty',
    authenticate,
    programController.getFaculty.bind(programController)
);

router.get('/:id/stats',
    authenticate,
    programController.getStats.bind(programController)
);

module.exports = router;