const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');
const { universityRateLimit } = require('../middleware/security');

// Apply rate limiting to all university routes
router.use(universityRateLimit);

// Routes for universities
router.get('/', universityController.getAllUniversities);
router.get('/stats', universityController.getUniversitiesWithStats);
router.get('/status/:status', universityController.getUniversitiesByStatus);
router.get('/statistics', universityController.getUniversityStats);
router.get('/:id', universityController.getUniversityById);
router.post('/', universityController.createUniversity);
router.post('/with-admin', universityController.createUniversityWithAdmin);
router.put('/:id', universityController.updateUniversity);
router.patch('/:id/activate', universityController.activateUniversity);
router.patch('/:id/deactivate', universityController.deactivateUniversity);
router.patch('/:id/suspend', universityController.suspendUniversity);
router.delete('/:id', universityController.deleteUniversity);

module.exports = router;