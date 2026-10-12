const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const Organization = require('../models/organization-model');

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication token required' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'JWT_SECRET is not configured' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.organizationId) return res.status(401).json({ message: 'Invalid authentication token' });
    const user = await User.findOne({ _id: payload.userId, organizationId: payload.organizationId }).select('-password');
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    const organization = await Organization.findById(user.organizationId).select('status');
    if (!organization || organization.status !== 'active') return res.status(403).json({ message: 'This organization is inactive or suspended' });
    req.organizationId = user.organizationId;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action' });
  }
  next();
};

module.exports = { requireAuth, allowRoles };
