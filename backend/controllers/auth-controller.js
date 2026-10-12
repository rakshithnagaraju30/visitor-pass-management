const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const Organization = require('../models/organization-model');

const login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const organizationSlug = String(req.body.organizationSlug || '').trim().toLowerCase();
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    if (!user.organizationId) return res.status(403).json({ message: 'This account is not assigned to an organization' });
    const organization = await Organization.findById(user.organizationId).select('name slug type status');
    if (!organization || organization.status !== 'active') return res.status(403).json({ message: 'This organization is inactive or suspended' });
    if (organizationSlug && organization.slug !== organizationSlug) {
      return res.status(401).json({ message: 'The account does not belong to that organization' });
    }
    const token = jwt.sign({ userId: user._id, organizationId: user.organizationId.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, organizationId: user.organizationId },
      organization,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const me = (req, res) => res.json({ user: req.user });
module.exports = { login, me };
