const User = require('../models/User');

// @desc    Get all CSR users
// @route   GET /api/admin/csrs
// @access  Private/Admin
const getAllCSRs = async (req, res) => {
  try {
    const csrs = await User.find({ role: 'csr' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: csrs.length,
      data: csrs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching CSR users',
      error: error.message
    });
  }
};

// @desc    Create a new CSR user
// @route   POST /api/admin/csrs
// @access  Private/Admin
const createCSR = async (req, res) => {
  try {
    const { name, email, password, permissions } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create CSR user
    const csr = await User.create({
      name,
      email,
      password,
      role: 'csr',
      permissions: permissions || [],
      createdBy: req.user._id
    });

    // Remove password from response
    const csrData = await User.findById(csr._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'CSR user created successfully',
      data: csrData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating CSR user',
      error: error.message
    });
  }
};

// @desc    Update CSR permissions
// @route   PUT /api/admin/csrs/:id/permissions
// @access  Private/Admin
const updateCSRPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const { id } = req.params;

    // Validate permissions array
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }

    // Find CSR user
    const csr = await User.findById(id);

    if (!csr) {
      return res.status(404).json({
        success: false,
        message: 'CSR user not found'
      });
    }

    // Ensure user is CSR
    if (csr.role !== 'csr') {
      return res.status(400).json({
        success: false,
        message: 'Can only update permissions for CSR users'
      });
    }

    // Update permissions
    csr.permissions = permissions;
    await csr.save();

    // Get updated user without password
    const updatedCSR = await User.findById(id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      data: updatedCSR
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating permissions',
      error: error.message
    });
  }
};

// @desc    Delete CSR user
// @route   DELETE /api/admin/csrs/:id
// @access  Private/Admin
const deleteCSR = async (req, res) => {
  try {
    const { id } = req.params;

    const csr = await User.findById(id);

    if (!csr) {
      return res.status(404).json({
        success: false,
        message: 'CSR user not found'
      });
    }

    // Ensure user is CSR
    if (csr.role !== 'csr') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete CSR users'
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'CSR user deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting CSR user',
      error: error.message
    });
  }
};

// @desc    Get available permissions list
// @route   GET /api/admin/permissions
// @access  Private/Admin
const getPermissions = async (req, res) => {
  try {
    const permissions = [
      { value: 'view_leads', label: 'View Leads' },
      { value: 'create_leads', label: 'Create Leads' },
      { value: 'edit_leads', label: 'Edit Leads' },
      { value: 'delete_leads', label: 'Delete Leads' },
      { value: 'view_sales', label: 'View Sales' },
      { value: 'create_sales', label: 'Create Sales' }
    ];

    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions',
      error: error.message
    });
  }
};

module.exports = {
  getAllCSRs,
  createCSR,
  updateCSRPermissions,
  deleteCSR,
  getPermissions
};
