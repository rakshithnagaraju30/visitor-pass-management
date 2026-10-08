const CheckLog = require('../models/check-log-model');

// Create Check Log
const createCheckLog = async (req, res) => {
  try {
    const checkLog = await CheckLog.create(req.body);

    res.status(201).json({
      message: 'Check log created successfully',
      checkLog,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create check log',
      error: error.message,
    });
  }
};

// Get All Check Logs
const getCheckLogs = async (req, res) => {
  try {
    const checkLogs = await CheckLog.find()
      .populate('visitor')
      .populate('pass')
      .populate('scannedBy');

    res.status(200).json(checkLogs);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch check logs',
      error: error.message,
    });
  }
};

// Get Check Log By ID
const getCheckLogById = async (req, res) => {
  try {
    const checkLog = await CheckLog.findById(req.params.id)
      .populate('visitor')
      .populate('pass')
      .populate('scannedBy');

    if (!checkLog) {
      return res.status(404).json({
        message: 'Check log not found',
      });
    }

    res.status(200).json(checkLog);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch check log',
      error: error.message,
    });
  }
};

module.exports = {
  createCheckLog,
  getCheckLogs,
  getCheckLogById,
};