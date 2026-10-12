const Pass = require('../models/pass-model');
const Visitor = require('../models/visitor-model');
const Appointment = require('../models/appointment-model');
const User = require('../models/user-model');
const { createPassPdfBuffer } = require('../services/pass-document-service');

// Get All Passes
const getPasses = async (req, res) => {
  try {
    const passes = await Pass.find({ organizationId: req.organizationId })
      .populate('visitor')
      .populate('appointment')
      .populate('issuedBy', 'name email role');

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
    const pass = await Pass.findOne({ _id: req.params.id, organizationId: req.organizationId })
      .populate('visitor')
      .populate('appointment')
      .populate('issuedBy', 'name email role');

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

// Generate the pass PDF on demand; no filesystem storage is required.
const getPassPdf = async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const pass = isObjectId
      ? await Pass.findOne({ _id: req.params.id, organizationId: req.organizationId })
      : await Pass.findOne({ passNumber: req.params.id, organizationId: req.organizationId });
    if (!pass) return res.status(404).json({ message: 'Pass not found' });
    const [visitor, appointment] = await Promise.all([
      Visitor.findOne({ _id: pass.visitor, organizationId: req.organizationId }),
      Appointment.findOne({ _id: pass.appointment, organizationId: req.organizationId }),
    ]);
    if (!visitor || !appointment) return res.status(404).json({ message: 'Pass details are incomplete' });
    const host = await User.findOne({ _id: appointment.host, organizationId: req.organizationId });
    const pdf = await createPassPdfBuffer(pass, visitor, appointment, host);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=\"${pass.passNumber}.pdf\"`);
    return res.send(pdf);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate pass PDF', error: error.message });
  }
};

// Update Pass Status
const updatePassStatus = async (req, res) => {
  try {
    if (!['active', 'used', 'expired', 'revoked'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid pass status' });
    }
    const pass = await Pass.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
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
  getPassPdf,
  getPasses,
  getPassById,
  updatePassStatus,
};