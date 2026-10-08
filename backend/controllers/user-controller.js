const User = require('../models/user-model');

// Create User
const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create user',
      error: error.message,
    });
  }
};

// Get All Users
const getUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

// Get User By ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
};