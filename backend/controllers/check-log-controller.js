const CheckLog = require('../models/check-log-model');
const Pass = require('../models/pass-model');
const Visitor = require('../models/visitor-model');
const Appointment = require('../models/appointment-model');
const { searchRegex, dateRangeFilter } = require('../utils/list-filters');

const createCheckLog = async (req, res) => {
  try {
    const { pass: passIdentifier, action } = req.body;
    if (!passIdentifier || !['check-in', 'check-out'].includes(action)) {
      return res.status(400).json({ message: 'A pass ID and valid action (check-in/check-out) are required' });
    }
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(passIdentifier));
    const pass = isObjectId
      ? await Pass.findOne({ _id: passIdentifier, organizationId: req.organizationId })
      : await Pass.findOne({ passNumber: String(passIdentifier), organizationId: req.organizationId });
    if (!pass) return res.status(404).json({ message: 'Pass not found' });
    if (pass.status !== 'active') return res.status(400).json({ message: `This pass is ${pass.status} and cannot be used` });
    const now = new Date();
    if (now < pass.validFrom || now > pass.validUntil) return res.status(400).json({ message: 'Pass is outside its validity period' });
    const lastLog = await CheckLog.findOne({ pass: pass._id, organizationId: req.organizationId }).sort({ timestamp: -1 });
    if (action === 'check-in' && lastLog?.action === 'check-in') return res.status(409).json({ message: 'This pass is already checked in' });
    if (action === 'check-out' && (!lastLog || lastLog.action !== 'check-in')) return res.status(409).json({ message: 'A check-in is required before check-out' });

    const checkLog = await CheckLog.create({ organizationId: req.organizationId, visitor: pass.visitor, pass: pass._id, action, scannedBy: req.user._id, timestamp: now });
    if (action === 'check-out') {
      pass.status = 'used';
      await pass.save();
      // The visit is over, so the appointment can no longer be cancelled
      await Appointment.updateOne({ _id: pass.appointment, organizationId: req.organizationId, status: 'approved' }, { status: 'completed' });
    }
    return res.status(201).json({ message: `${action} recorded successfully`, checkLog });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to record check log', error: error.message });
  }
};
// Supports ?search=&action=&from=&to=
const getCheckLogs = async (req, res) => {
  try {
    const { search, action, from, to } = req.query;
    const filter = { organizationId: req.organizationId, ...dateRangeFilter('timestamp', from, to) };
    if (['check-in', 'check-out'].includes(action)) filter.action = action;

    const regex = searchRegex(search);
    if (regex) {
      // Search matches the visitor's name, email or phone, or the pass number
      const [visitors, passes] = await Promise.all([
        Visitor.find({ organizationId: req.organizationId, $or: [{ name: regex }, { email: regex }, { phone: regex }] }).select('_id'),
        Pass.find({ organizationId: req.organizationId, passNumber: regex }).select('_id'),
      ]);
      filter.$or = [{ visitor: { $in: visitors.map((visitor) => visitor._id) } }, { pass: { $in: passes.map((pass) => pass._id) } }];
    }

    const checkLogs = await CheckLog.find(filter).populate('visitor').populate('pass').populate('scannedBy', '-password').sort({ timestamp: -1 });
    return res.json(checkLogs);
  } catch (error) { return res.status(500).json({ message: 'Failed to fetch check logs', error: error.message }); }
};
const getCheckLogById = async (req, res) => {
  try {
    const checkLog = await CheckLog.findOne({ _id: req.params.id, organizationId: req.organizationId }).populate('visitor').populate('pass').populate('scannedBy', '-password');
    if (!checkLog) return res.status(404).json({ message: 'Check log not found' });
    return res.json(checkLog);
  } catch (error) { return res.status(400).json({ message: 'Invalid check log ID', error: error.message }); }
};
module.exports = { createCheckLog, getCheckLogs, getCheckLogById };
