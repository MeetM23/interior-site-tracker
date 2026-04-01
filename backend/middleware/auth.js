const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
};

exports.ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner')
    return res.status(403).json({ message: 'Owner access required' });
  next();
};

exports.ownerOrDesigner = (req, res, next) => {
  if (req.user.role === 'owner') return next();
  if (req.user.role === 'designer') return next();
  return res.status(403).json({ message: 'Access denied' });
};