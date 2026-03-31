const express = require('express');
const CourseController = require('../controllers/CourseController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { courseRateLimit } = require('../middleware/security');

const router = express.Router();
const courseController = new CourseController();

// Apply rate limiting to all course routes
router.use(courseRateLimit);

// Validation schemas
const createCourseSchema = {
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    code: { type: 'string', required: true, minLength: 1, maxLength: 20 },
    description: { type: 'string', required: false, maxLength: 1000 },
    credits: { type: 'number', required: true, minimum: 1, maximum: 10 },
    courseType: { type: 'string', required: false, enum: ['core', 'elective', 'optional'] },
    semester: { type: 'string', required: false, enum: ['fall', 'spring', 'summer', 'winter'] },
    year: { type: 'number', required: false, minimum: 2000, maximum: 2100 },
    departmentId: { type: 'string', required: true, format: 'uuid' },
    lecturerId: { type: 'string', required: false, format: 'uuid' },
    maxStudents: { type: 'number', required: false, minimum: 1 },
    prerequisites: { type: 'string', required: false },
    syllabusUrl: { type: 'string', required: false, format: 'uri' },
    status: { type: 'string', required: false, enum: ['active', 'inactive', 'cancelled'] }
};

const updateCourseSchema = {
    name: { type: 'string', required: false, minLength: 1, maxLength: 255 },
    code: { type: 'string', required: false, minLength: 1, maxLength: 20 },
    description: { type: 'string', required: false, maxLength: 1000 },
    credits: { type: 'number', required: false, minimum: 1, maximum: 10 },
    courseType: { type: 'string', required: false, enum: ['core', 'elective', 'optional'] },
    semester: { type: 'string', required: false, enum: ['fall', 'spring', 'summer', 'winter'] },
    year: { type: 'number', required: false, minimum: 2000, maximum: 2100 },
    lecturerId: { type: 'string', required: false, format: 'uuid' },
    maxStudents: { type: 'number', required: false, minimum: 1 },
    prerequisites: { type: 'string', required: false },
    syllabusUrl: { type: 'string', required: false, format: 'uri' },
    status: { type: 'string', required: false, enum: ['active', 'inactive', 'cancelled'] }
};

const assignLecturerSchema = {
    lecturerId: { type: 'string', required: true, format: 'uuid' }
};

// Routes
router.post('/',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod']),
    validateRequest(createCourseSchema),
    courseController.create.bind(courseController)
);

router.put('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod', 'lecturer']),
    validateRequest(updateCourseSchema),
    courseController.update.bind(courseController)
);

router.delete('/:id',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod']),
    courseController.delete.bind(courseController)
);

router.get('/:id',
    authenticate,
    courseController.getById.bind(courseController)
);

router.get('/',
    authenticate,
    courseController.getAll.bind(courseController)
);

// Lecturer assignment routes
router.put('/:id/assign-lecturer',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod']),
    validateRequest(assignLecturerSchema),
    courseController.assignLecturer.bind(courseController)
);

router.put('/:id/remove-lecturer',
    authenticate,
    authorize(['system_admin', 'university_admin', 'dean', 'hod']),
    courseController.removeLecturer.bind(courseController)
);

// Relationship routes
router.get('/:id/lecturer',
    authenticate,
    courseController.getLecturer.bind(courseController)
);

router.get('/:id/department',
    authenticate,
    courseController.getDepartment.bind(courseController)
);

router.get('/:id/faculty',
    authenticate,
    courseController.getFaculty.bind(courseController)
);

// Special routes
router.get('/public/available',
    authenticate,
    courseController.getAvailableCourses.bind(courseController)
);

router.get('/:id/stats',
    authenticate,
    courseController.getStats.bind(courseController)
);

module.exports = router;