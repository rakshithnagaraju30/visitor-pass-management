const Visitor = require('../models/visitor-model');

// Create Visitor
const createVisitor = async (req, res) => {
  try {
    const { name, email, phone, photo } = req.body;
    const visitor = await Visitor.create({ name, email, phone, photo, organizationId: req.organizationId });

    res.status(201).json({
      message: 'Visitor registered successfully',
      visitor,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to register visitor',
      error: error.message,
    });
  }
};

// Get All Visitors
const getVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({ organizationId: req.organizationId });

    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch visitors',
      error: error.message,
    });
  }
};

// Get Visitor By ID
const getVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ _id: req.params.id, organizationId: req.organizationId });

    if (!visitor) {
      return res.status(404).json({
        message: 'Visitor not found',
      });
    }

    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch visitor',
      error: error.message,
    });
  }
};

// Update Visitor
const updateVisitor = async (req, res) => {
  try {
    const { name, email, phone, photo } = req.body;
    const visitor = await Visitor.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { name, email, phone, photo },
      { new: true }
    );

    if (!visitor) {
      return res.status(404).json({
        message: 'Visitor not found',
      });
    }

    res.status(200).json({
      message: 'Visitor updated successfully',
      visitor,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update visitor',
      error: error.message,
    });
  }
};

module.exports = {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
};