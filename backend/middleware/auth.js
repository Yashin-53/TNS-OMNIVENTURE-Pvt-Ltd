const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Returns the logged-in user from the Bearer token, or null
const getUserFromToken = async (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const { id } = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(id);
    return user && user.isActive ? user : null;
  } catch {
    return null;
  }
};

// Login required
exports.protect = async (req, res, next) => {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ message: 'Please login to continue' });
  req.user = user;
  next();
};

// Works for guests too, req.user is null when not logged in
exports.optionalAuth = async (req, res, next) => {
  req.user = await getUserFromToken(req);
  next();
};

exports.sellerOnly = (req, res, next) => {
  if (req.user.role === 'seller' || req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Only sellers can post properties' });
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access only' });
};
