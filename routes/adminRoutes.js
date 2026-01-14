const express = require('express');
const router = express.Router();
const {
  getAllCSRs,
  createCSR,
  updateCSRPermissions,
  deleteCSR,
  getPermissions
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// CSR management routes
router.route('/csrs')
  .get(getAllCSRs)
  .post(createCSR);

router.route('/csrs/:id')
  .delete(deleteCSR);

router.route('/csrs/:id/permissions')
  .put(updateCSRPermissions);

// Get available permissions
router.get('/permissions', getPermissions);

module.exports = router;
