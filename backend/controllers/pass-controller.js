const Pass = require('../models/pass-model');

// Create Pass
const createPass = async (req, res) => {
  try {
    const pass = await Pass.create(req.body);

    res.status(201).json({
      message: 'Pass issued successfully',
      pass,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to issue pass',
      error: error.message,
    });
  }
};

// Get All Passes
const getPasses = async (req, res) => {
  try {
    const passes = await Pass.find()
      .populate('visitor')
      .populate('appointment')
      .populate('issuedBy');

    res.status(200).json(passes);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch passes',
      error: error.message,
    });
  }
};

// Get Pass By ID
const getPassById = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate('visitor')
      .populate('appointment')
      .populate('issuedBy');

    if (!pass) {
      return res.status(404).json({
        message: 'Pass not found',
      });
    }

    res.status(200).json(pass);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch pass',
      error: error.message,
    });
  }
};

// Update Pass Status
const updatePassStatus = async (req, res) => {
  try {
    const pass = await Pass.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!pass) {
      return res.status(404).json({
        message: 'Pass not found',
      });
    }

    res.status(200).json({
      message: 'Pass status updated successfully',
      pass,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update pass status',
      error: error.message,
    });
  }
};

module.exports = {
  createPass,
  getPasses,
  getPassById,
  updatePassStatus,
};