const Invoice = require('../models/Invoice');
const Project = require('../models/Project');

// ============================
// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
// ============================
const getInvoices = async (req, res) => {
  try {
    const filter =
      req.user.role === 'admin' ? {} : { createdBy: req.user._id };

    const invoices = await Invoice.find(filter)
      .populate('project', 'name client')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
};

// ============================
// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
// ============================
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('project', 'name client')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (
      req.user.role === 'csr' &&
      invoice.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Failed to fetch invoice' });
  }
};

// ============================
// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
// ============================
const createInvoice = async (req, res) => {
  try {
    const {
      project,
      clientName,
      clientEmail,
      clientAddress,
      items,
      subTotal,
      tax = 0,
      discount = 0,
      totalAmount,
      issueDate,
      dueDate,
      status = 'Pending',
      notes,
    } = req.body;

    if (!project || !clientName || !items || !dueDate || dueDate === "" || !subTotal || !totalAmount) {
      return res.status(400).json({
        message: 'Project, client name, items, due date, subTotal and totalAmount are required',
      });
    }

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (
      req.user.role === 'csr' &&
      projectExists.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const invoiceData = {
      project,
      clientName,
      clientEmail,
      clientAddress,
      items,
      subTotal,
      tax,
      discount,
      totalAmount,
      dueDate,
      status,
      notes,
      createdBy: req.user._id,
    };

    if (issueDate) invoiceData.issueDate = issueDate;

    const invoice = await Invoice.create(invoiceData);

    const populatedInvoice = await Invoice.findById(invoice._id).populate(
      'project',
      'name client'
    );

    res.status(201).json({
      success: true,
      data: populatedInvoice,
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Failed to create invoice' });
  }
};

// ============================
// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
// ============================
const updateInvoice = async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (
      req.user.role === 'csr' &&
      invoice.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('project', 'name client');

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Failed to update invoice' });
  }
};

// ============================
// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
// ============================
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (
      req.user.role === 'csr' &&
      invoice.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Failed to delete invoice' });
  }
};

// ============================
// @desc    Invoice statistics
// @route   GET /api/invoices/stats
// @access  Private
// ============================
const getInvoiceStats = async (req, res) => {
  try {
    const filter =
      req.user.role === 'admin' ? {} : { createdBy: req.user._id };

    const total = await Invoice.countDocuments(filter);

    const totalRevenue = await Invoice.aggregate([
      { $match: { ...filter, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const byStatus = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        total,
        totalRevenue: totalRevenue[0]?.total || 0,
        byStatus,
      },
    });
  } catch (error) {
    console.error('Invoice stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
};
