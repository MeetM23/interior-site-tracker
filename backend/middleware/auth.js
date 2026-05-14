const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secure_secret_for_jwt_signing';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = await User.findById(decoded.id).select('-password').populate('companyId').lean();
    if (!req.user || req.user.isDeleted) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found or deleted' });
    }
    if (req.user.role !== 'SUPER_ADMIN' && req.user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact the Administrator.' });
    }
    if (req.user.role !== 'SUPER_ADMIN' && req.user.companyId && req.user.companyId.status === 'Suspended') {
       return res.status(403).json({ success: false, message: 'Your company account is suspended. Contact the Administrator.' });
    }
    next();
  } catch { 
    res.status(401).json({ success: false, message: 'Not authorized, token failed' }); 
  }
};

/**
 * Middleware to restrict access to specific roles.
 * @param  {...string} roles Array of allowed roles e.g. 'SUPER_ADMIN', 'OWNER'
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Role (${req.user?.role}) is not allowed to access this resource` });
    }
    next();
  };
};

/**
 * Middleware to ensure the user belongs to a company if they are not a SUPER_ADMIN.
 * Helps prevent designers or owners from accessing endpoints without a valid company context.
 */
exports.requireCompany = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN' && !req.user.companyId) {
    return res.status(403).json({ success: false, message: 'User is not associated with any company' });
  }
  // To keep code compatibility with other routes relying on req.user.companyId as an ObjectId string:
  if (req.user.companyId && req.user.companyId._id) {
    req.user.companyId = req.user.companyId._id;
  }
  next();
};