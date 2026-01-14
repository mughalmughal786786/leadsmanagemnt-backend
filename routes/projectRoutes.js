const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

// Stats route (must be before :id route)
router.get('/stats', protect, checkPermission('view_sales'), getProjectStats);

// Main CRUD routes
router.route('/')
  .get(protect, checkPermission('view_sales'), getProjects)
  .post(protect, checkPermission('create_sales'), createProject);

router.route('/:id')
  .get(protect, checkPermission('view_sales'), getProject)
  .put(protect, checkPermission('create_sales'), updateProject)
  .delete(protect, checkPermission('create_sales'), deleteProject);

module.exports = router;
