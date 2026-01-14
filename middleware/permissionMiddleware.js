// Middleware to check if user has required permission(s)
const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        requiredPermissions
      });
    }

    next();
  };
};

// Middleware to ensure CSR can only access their own data
const checkOwnership = (req, res, next) => {
  // Admin can access all data
  if (req.user.role === 'admin') {
    return next();
  }

  // For CSR, add filter to only access their own data
  // This will be used in query filters
  req.userFilter = { createdBy: req.user._id };
  
  next();
};

module.exports = {
  checkPermission,
  checkOwnership
};
