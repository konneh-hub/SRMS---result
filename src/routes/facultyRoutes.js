const express = require('express');
const FacultyController = require('../controllers/FacultyController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { facultyRateLimit } = require('../middleware/security');

const router = express.Router();
const facultyController = new FacultyController();

// Apply rate limiting to all faculty routes
router.use(facultyRateLimit);

// Validation schemas
const createFacultySchema = {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    code: { type: 'string', required: true, minLength: 1, maxLength: 20 },
    description: { type: 'string', required: false, maxLength: 500 },
    deanId: { type: 'string', required: false, format: 'uuid' },
    universityId: { type: 'string', required: true, format: 'uuid' },
    isActive: { type: 'boolean', required: false }
};

const updateFacultySchema = {
    name: { type: 'string', required: false, minLength: 1, maxLength: 100 },
    code: { type: 'string', required: false, minLength: 1, maxLength: 20 },
    description: { type: 'string', required: false, maxLength: 500 },
    deanId: { type: 'string', required: false, format: 'uuid' },
    isActive: { type: 'boolean', required: false }
};

// Routes
router.post('/',
    authenticate,
    authorize(['system_admin', 'university_admin']),
    validateRequest(createFacultySchema),
    facultyController.create.bind(facultyController)
);

router.put('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean']),
    validateRequest(updateFacultySchema),
    facultyController.update.bind(facultyController)
);

router.delete('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin']),
    facultyController.delete.bind(facultyController)
);

router.get('/:id',
    authenticate,
    facultyController.getById.bind(facultyController)
);

router.get('/',
    authenticate,
    facultyController.getAll.bind(facultyController)
);

// Relationship routes
router.get('/:id/departments',
    authenticate,
    facultyController.getDepartments.bind(facultyController)
);

router.get('/:id/programs',
    authenticate,
    facultyController.getPrograms.bind(facultyController)
);

router.get('/:id/stats',
    authenticate,
    facultyController.getStats.bind(facultyController)
);

module.exports = router;