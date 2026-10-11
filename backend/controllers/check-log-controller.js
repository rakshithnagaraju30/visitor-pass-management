const CheckLog = require('../models/check-log-model');
const Pass = require('../models/pass-model');

const createCheckLog = async (req, res) => {
  try {
    const { pass: passIdentifier, action } = req.body;
    if (!passIdentifier || !['check-in', 'check-out'].includes(action)) {
      return res.status(400).json({ message: 'A pass ID and valid action (check-in/check-out) are required' });
    }
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(passIdentifier));
    const pass = isObjectId
      ? await Pass.findById(passIdentifier)
      : await Pass.findOne({ passNumber: String(passIdentifier) });
    if (!pass) return res.status(404).json({ message: 'Pass not found' });
    if (pass.status !== 'active') return res.status(400).json({ message: `This pass is ${pass.status} and cannot be used` });
    const now = new Date();
    if (now < pass.validFrom || now > pass.validUntil) return res.status(400).json({ message: 'Pass is outside its validity period' });
    const lastLog = await CheckLog.findOne({ pass: pass._id }).sort({ timestamp: -1 });
    if (action === 'check-in' && lastLog?.action === 'check-in') return res.status(409).json({ message: 'This pass is already checked in' });
    if (action === 'check-out' && (!lastLog || lastLog.action !== 'check-in')) return res.status(409).json({ message: 'A check-in is required before check-out' });

    const checkLog = await CheckLog.create({ visitor: pass.visitor, pass: pass._id, action, scannedBy: req.user._id, timestamp: now });
    if (action === 'check-out') {
      pass.status = 'used';
      await pass.save();
    }
    return res.status(201).json({ message: `${action} recorded successfully`, checkLog });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to record check log', error: error.message });
  }
};
const getCheckLogs = async (req, res) => {
  try {
    const checkLogs = await CheckLog.find().populate('visitor').populate('pass').populate('scannedBy', '-password').sort({ timestamp: -1 });
    return res.json(checkLogs);
  } catch (error) { return res.status(500).json({ message: 'Failed to fetch check logs', error: error.message }); }
};
const getCheckLogById = async (req, res) => {
  try {
    const checkLog = await CheckLog.findById(req.params.id).populate('visitor').populate('pass').populate('scannedBy', '-password');
    if (!checkLog) return res.status(404).json({ message: 'Check log not found' });
    return res.json(checkLog);
  } catch (error) { return res.status(400).json({ message: 'Invalid check log ID', error: error.message }); }
};
module.exports = { createCheckLog, getCheckLogs, getCheckLogById };
