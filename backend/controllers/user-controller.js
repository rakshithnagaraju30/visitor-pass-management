const bcrypt = require('bcryptjs');
const User = require('../models/user-model');

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  organizationId: user.organizationId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'Name, email, password, and role are required' });
    if (!['admin', 'security', 'employee'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const normalizedEmail = String(email).trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail, organizationId: req.organizationId })) return res.status(409).json({ message: 'A user with this email already exists' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword, role, phone, organizationId: req.organizationId });
    return res.status(201).json({ message: 'User created successfully', user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try { const users = await User.find({ organizationId: req.organizationId }).select('-password').sort({ createdAt: -1 }); return res.json(users); }
  catch (error) { return res.status(500).json({ message: 'Failed to fetch users', error: error.message }); }
};
const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, organizationId: req.organizationId }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) { return res.status(400).json({ message: 'Invalid user ID', error: error.message }); }
};
const updateUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, organizationId: req.organizationId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    for (const key of ['name', 'email', 'phone', 'role']) if (req.body[key] !== undefined) user[key] = req.body[key];
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 12);
    await user.save();
    return res.json({ message: 'User updated successfully', user: publicUser(user) });
  } catch (error) { return res.status(400).json({ message: 'Failed to update user', error: error.message }); }
};
const deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot delete your own account' });
    const user = await User.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'User deleted successfully' });
  } catch (error) { return res.status(400).json({ message: 'Failed to delete user', error: error.message }); }
};
module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };
