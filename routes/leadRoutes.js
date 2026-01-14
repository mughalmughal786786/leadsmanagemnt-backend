const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

// Stats route (must be before :id route)
router.get('/stats', protect, getLeadStats);

// Main CRUD routes
router.route('/')
  .get(protect, checkPermission('view_leads'), getLeads)
  .post(protect, checkPermission('create_leads'), createLead);

router.route('/:id')
  .get(protect, checkPermission('view_leads'), getLead)
  .put(protect, checkPermission('edit_leads'), updateLead)
  .delete(protect, checkPermission('delete_leads'), deleteLead);

module.exports = router;
