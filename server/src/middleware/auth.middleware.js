const jwt = require('jsonwebtoken');
const User = require('../modules/users/model/user.model');
const Role = require('../modules/users/model/role.model');
const AppError = require('../shared/errors/appError');

const authenticateJWT = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and check if active
    const user = await User.findById(decoded.userId).populate('roleId');
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    
    if (user.status !== 'Active') {
      return next(new AppError('Your account has been disabled. Please contact support.', 403));
    }
    
    // Attach user to request context
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roleId) {
      return next(new AppError('Access denied. No user role found.', 403));
    }
    
    const userRole = req.user.roleId.name;
    const isAllowed = allowedRoles.includes(userRole);
    
    if (!isAllowed) {
      return next(new AppError(`Access denied. Role '${userRole}' is not authorized to access this resource.`, 403));
    }
    
    next();
  };
};

module.exports = {
  authenticateJWT,
  requireRole,
};
