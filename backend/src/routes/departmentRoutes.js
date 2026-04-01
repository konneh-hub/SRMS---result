const express = require('express');
const DepartmentController = require('../controllers/DepartmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { departmentRateLimit } = require('../middleware/security');

const router = express.Router();
const departmentController = new DepartmentController();

// Apply rate limiting to all department routes
router.use(departmentRateLimit);

// Validation schemas
const createDepartmentSchema = {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    code: { type: 'string', required: true, minLength: 1, maxLength: 20 },
    description: { type: 'string', required: false, maxLength: 500 },
    hodId: { type: 'string', required: false, format: 'uuid' },
    facultyId: { type: 'string', required: true, format: 'uuid' },
    isActive: { type: 'boolean', required: false }
};

const updateDepartmentSchema = {
    name: { type: 'string', required: false, minLength: 1, maxLength: 100 },
    code: { type: 'string', required: false, minLength: 1, maxLength: 20 },
    description: { type: 'string', required: false, maxLength: 500 },
    hodId: { type: 'string', required: false, format: 'uuid' },
    isActive: { type: 'boolean', required: false }
};

// Routes
router.post('/',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean']),
    validateRequest(createDepartmentSchema),
    departmentController.create.bind(departmentController)
);

router.put('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod']),
    validateRequest(updateDepartmentSchema),
    departmentController.update.bind(departmentController)
);

router.delete('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean']),
    departmentController.delete.bind(departmentController)
);

router.get('/:id',
    authenticate,
    departmentController.getById.bind(departmentController)
);

router.get('/',
    authenticate,
    departmentController.getAll.bind(departmentController)
);

// Relationship routes
router.get('/:id/programs',
    authenticate,
    departmentController.getPrograms.bind(departmentController)
);

router.get('/:id/faculty',
    authenticate,
    departmentController.getFaculty.bind(departmentController)
);

router.get('/:id/stats',
    authenticate,
    departmentController.getStats.bind(departmentController)
);

module.exports = router;