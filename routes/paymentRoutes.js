const express = require('express');
const router = express.Router();

const {
  getPayments,
  getPaymentStats,
  createPayment,
  updatePayment,
  deletePayment
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

// ===============================
// ROUTES
// ===============================
router.get('/stats', protect, getPaymentStats);

router.get('/', protect, getPayments);

router.post(
  '/',
  protect,
  checkPermission('create_sales'),
  createPayment
);

router.put(
  '/:id',
  protect,
  checkPermission('create_sales'),
  updatePayment
);

router.delete(
  '/:id',
  protect,
  checkPermission('create_sales'),
  deletePayment
);

module.exports = router;
