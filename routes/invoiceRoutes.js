const express = require('express');
const router = express.Router();

const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
} = require('../controllers/invoiceController');

const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

// ============================
// Invoice Statistics (TOP)
// ============================
router.get('/stats', protect, getInvoiceStats);

// ============================
// Main Invoice Routes
// ============================
router
  .route('/')
  .get(protect, checkPermission('view_sales'), getInvoices)
  .post(protect, createInvoice);

router
  .route('/:id')
  .get(protect, checkPermission('view_sales'), getInvoice)
  .put(protect, checkPermission('create_sales'), updateInvoice)
  .delete(protect, checkPermission('create_sales'), deleteInvoice);

module.exports = router;
