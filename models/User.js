const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'csr'],
    default: 'csr'
  },
  permissions: {
    type: [String],
    default: [],
    enum: [
      'view_leads',
      'create_leads',
      'edit_leads',
      'delete_leads',
      'view_sales',
      'create_sales'
    ]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has a specific permission
userSchema.methods.hasPermission = function(permission) {
  // Admin has all permissions
  if (this.role === 'admin') {
    return true;
  }
  // Check if CSR has the specific permission
  return this.permissions.includes(permission);
};

// Method to get all permissions (admin gets all, CSR gets assigned)
userSchema.methods.getAllPermissions = function() {
  if (this.role === 'admin') {
    return [
      'view_leads',
      'create_leads',
      'edit_leads',
      'delete_leads',
      'view_sales',
      'create_sales'
    ];
  }
  return this.permissions;
};

module.exports = mongoose.model('User', userSchema);
