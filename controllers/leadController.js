const Lead = require('../models/Lead');

// @desc    Get all leads (Admin: all, CSR: own only)
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    
    const leads = await Lead.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Server error while fetching leads' });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check ownership for CSR
    if (req.user.role === 'csr' && lead.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this lead' });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ message: 'Server error while fetching lead' });
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private (requires create_leads permission)
const createLead = async (req, res) => {
  try {
    const { name, email, phone, source, status, notes } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Please provide name, email, and phone' });
    }

    // Check if lead with email already exists
    const existingLead = await Lead.findOne({ email: email.toLowerCase() });
    if (existingLead) {
      return res.status(400).json({ message: 'Lead with this email already exists' });
    }

    // Create lead
    const lead = await Lead.create({
      name,
      email,
      phone,
      source: source || 'Other',
      status: status || 'New',
      notes,
      createdBy: req.user._id
    });

    const populatedLead = await Lead.findById(lead._id).populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedLead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while creating lead' });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private (requires edit_leads permission)
const updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check ownership for CSR
    if (req.user.role === 'csr' && lead.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    const { name, email, phone, source, status, notes } = req.body;

    // If email is being changed, check for duplicates
    if (email && email.toLowerCase() !== lead.email) {
      const existingLead = await Lead.findOne({ email: email.toLowerCase() });
      if (existingLead) {
        return res.status(400).json({ message: 'Lead with this email already exists' });
      }
    }

    // Update lead
    lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        name: name || lead.name,
        email: email || lead.email,
        phone: phone || lead.phone,
        source: source || lead.source,
        status: status || lead.status,
        notes: notes !== undefined ? notes : lead.notes
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while updating lead' });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private (requires delete_leads permission)
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check ownership for CSR
    if (req.user.role === 'csr' && lead.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this lead' });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Server error while deleting lead' });
  }
};

// @desc    Get lead statistics
// @route   GET /api/leads/stats
// @access  Private
const getLeadStats = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

    const stats = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: {
        total,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Get lead stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats
};
