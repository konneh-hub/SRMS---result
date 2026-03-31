const express = require('express');
const StaffController = require('../controllers/StaffController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { staffRateLimit } = require('../middleware/security');

const router = express.Router();
const staffController = new StaffController();

// Apply rate limiting to all staff routes
router.use(staffRateLimit);

// Validation schemas
const createStaffSchema = {
    email: { type: 'string', required: true, format: 'email' },
    password: { type: 'string', required: true, minLength: 6 },
    firstName: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    lastName: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    role: { type: 'string', required: true, enum: ['university_admin', 'dean', 'hod', 'exam_officer', 'lecturer'] },
    universityId: { type: 'string', required: false, format: 'uuid' },
    departmentId: { type: 'string', required: false, format: 'uuid' },
    facultyId: { type: 'string', required: false, format: 'uuid' },
    employeeId: { type: 'string', required: false, maxLength: 50 },
    phone: { type: 'string', required: false, maxLength: 20 },
    dateOfBirth: { type: 'string', required: false, format: 'date' },
    gender: { type: 'string', required: false, enum: ['male', 'female', 'other'] },
    address: { type: 'string', required: false, maxLength: 500 },
    qualification: { type: 'string', required: false, maxLength: 255 },
    specialization: { type: 'string', required: false, maxLength: 255 },
    experienceYears: { type: 'number', required: false, minimum: 0 },
    joiningDate: { type: 'string', required: false, format: 'date' },
    salary: { type: 'number', required: false, minimum: 0 },
    contractType: { type: 'string', required: false, enum: ['permanent', 'contract', 'part_time', 'visiting'] },
    emergencyContactName: { type: 'string', required: false, maxLength: 100 },
    emergencyContactPhone: { type: 'string', required: false, maxLength: 20 },
    profilePictureUrl: { type: 'string', required: false, format: 'uri' },
    isActive: { type: 'boolean', required: false }
};

const updateStaffSchema = {
    firstName: { type: 'string', required: false, minLength: 1, maxLength: 100 },
    lastName: { type: 'string', required: false, minLength: 1, maxLength: 100 },
    departmentId: { type: 'string', required: false, format: 'uuid' },
    facultyId: { type: 'string', required: false, format: 'uuid' },
    employeeId: { type: 'string', required: false, maxLength: 50 },
    phone: { type: 'string', required: false, maxLength: 20 },
    dateOfBirth: { type: 'string', required: false, format: 'date' },
    gender: { type: 'string', required: false, enum: ['male', 'female', 'other'] },
    address: { type: 'string', required: false, maxLength: 500 },
    qualification: { type: 'string', required: false, maxLength: 255 },
    specialization: { type: 'string', required: false, maxLength: 255 },
    experienceYears: { type: 'number', required: false, minimum: 0 },
    joiningDate: { type: 'string', required: false, format: 'date' },
    salary: { type: 'number', required: false, minimum: 0 },
    contractType: { type: 'string', required: false, enum: ['permanent', 'contract', 'part_time', 'visiting'] },
    emergencyContactName: { type: 'string', required: false, maxLength: 100 },
    emergencyContactPhone: { type: 'string', required: false, maxLength: 20 },
    profilePictureUrl: { type: 'string', required: false, format: 'uri' },
    isActive: { type: 'boolean', required: false }
};

const assignRoleSchema = {
    role: { type: 'string', required: true, enum: ['university_admin', 'dean', 'hod', 'exam_officer', 'lecturer'] }
};

const assignDepartmentSchema = {
    departmentId: { type: 'string', required: true, format: 'uuid' }
};

// Routes
router.post('/',
    authenticate,
    authorize(['system_admin', 'university_admin']),
    validateRequest(createStaffSchema),
    staffController.create.bind(staffController)
);

router.put('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin']),
    validateRequest(updateStaffSchema),
    staffController.update.bind(staffController)
);

router.delete('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin']),
    staffController.delete.bind(staffController)
);

router.get('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod', 'exam_officer']),
    staffController.getById.bind(staffController)
);

router.get('/',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod', 'exam_officer']),
    staffController.getAll.bind(staffController)
);

// Role and department assignment routes
router.put('/:id/assign-role',
    authenticate,
    authorize(['system_admin', 'university_admin']),
    validateRequest(assignRoleSchema),
    staffController.assignRole.bind(staffController)
);

router.put('/:id/assign-department',
    authenticate,
    authorize(['system_admin', 'university_admin']),
    validateRequest(assignDepartmentSchema),
    staffController.assignDepartment.bind(staffController)
);

// Bulk upload route
router.post('/bulk-upload',
    authenticate,
    authorize(['system_admin', 'university_admin']),
    staffController.bulkUpload.bind(staffController)
);

// Statistics route
router.get('/stats/:universityId',
    authenticate,
    authorize(['system_admin', 'university_admin']),
    staffController.getStats.bind(staffController)
);

module.exports = router;