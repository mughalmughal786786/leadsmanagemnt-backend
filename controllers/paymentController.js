const Payment = require('../models/Payment');
const Project = require('../models/Project');

// ===============================
// GET ALL PAYMENTS
// ===============================
const getPayments = async (req, res) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { createdBy: req.user._id };

    const payments = await Payment.find(filter)
      .populate('project', 'name client')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

// ===============================
// PAYMENT STATS  (FIXED ✅)
// ===============================
const getPaymentStats = async (req, res) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { createdBy: req.user._id };

    const total = await Payment.countDocuments(filter);

    const completedRevenue = await Payment.aggregate([
      { $match: { ...filter, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const byStatus = await Payment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        totalRevenue: completedRevenue[0]?.total || 0,
        byStatus,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// ===============================
// CREATE PAYMENT
// ===============================
const createPayment = async (req, res) => {
  try {
    const { project, amount } = req.body;

    if (!project || !amount) {
      return res.status(400).json({
        message: 'Project and amount are required',
      });
    }

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const payment = await Payment.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// ===============================
// UPDATE PAYMENT
// ===============================
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===============================
// DELETE PAYMENT
// ===============================
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      success: true,
      message: 'Payment deleted',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// EXPORTS  (VERY IMPORTANT ❗)
// ===============================
module.exports = {
  getPayments,
  getPaymentStats,
  createPayment,
  updatePayment,
  deletePayment,
};
