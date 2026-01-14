const express = require('express');
const router = express.Router();

const {
  getAdminDashboard,
  getCSRDashboard,
  getAgentAnalytics
} = require('../controllers/dashboardController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Admin dashboard
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

// CSR dashboard
router.get('/csr', protect, getCSRDashboard);

// Agent analytics (Admin only)
router.get('/agent-analytics', protect, authorize('admin'), getAgentAnalytics);

module.exports = router;
