const mongoose = require('mongoose');
const Visitor = require('../models/visitor-model');
const Appointment = require('../models/appointment-model');
const Pass = require('../models/pass-model');
const User = require('../models/user-model');
const { issuePassForAppointment } = require('../services/pass-issuance-service');

const registerAndIssue = async (req, res) => {
  let createdVisitor = null;
  let createdAppointment = null;
  let createdPass = null;
  try {
    // Validate and normalize the visitor and appointment input.
    const { visitor: visitorInput, appointment: appointmentInput } = req.body;
    if (!visitorInput || !appointmentInput) {
      return res.status(400).json({ message: 'visitor and appointment objects are required' });
    }
    const name = String(visitorInput.name || '').trim();
    const phone = String(visitorInput.phone || '').trim();
    const email = String(visitorInput.email || '').trim().toLowerCase();
    const purpose = String(appointmentInput.purpose || '').trim();
    const appointmentDate = new Date(appointmentInput.appointmentDate);
    const appointmentTime = String(appointmentInput.appointmentTime || '').trim();

    if (!name || !phone || !purpose || !appointmentTime || !appointmentInput.appointmentDate || Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: 'Visitor name, phone, appointment date/time, and purpose are required' });
    }
    if (appointmentDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({ message: 'Appointment date cannot be in the past' });
    }

    let visitor;
    if (visitorInput.existingVisitorId) {
      // Use the selected visitor profile when an existing ID is provided.
      if (!mongoose.isValidObjectId(visitorInput.existingVisitorId)) return res.status(400).json({ message: 'Invalid existing visitor ID' });
      visitor = await Visitor.findOne({ _id: visitorInput.existingVisitorId, organizationId: req.organizationId });
      if (!visitor) return res.status(404).json({ message: 'Selected visitor was not found' });
    } else {
      // Reuse an existing visitor by phone or email to avoid duplicate profiles.
      const criteria = [{ phone }];
      if (email) criteria.push({ email });
      visitor = await Visitor.findOne({ organizationId: req.organizationId, $or: criteria });
      if (!visitor) {
        visitor = await Visitor.create({ organizationId: req.organizationId, name, phone, email: email || undefined, photo: visitorInput.photo || undefined });
        createdVisitor = visitor;
      } else {
        // Keep existing profile but refresh the fields the employee supplied.
        visitor.name = name;
        if (email) visitor.email = email;
        if (visitorInput.photo) visitor.photo = visitorInput.photo;
        await visitor.save();
      }
    }

    const host = await User.findOne({ _id: req.user._id, organizationId: req.organizationId });
    if (!host) return res.status(401).json({ message: 'Logged-in employee account was not found' });

    // Create an approved appointment for the authenticated employee.
    // Employees may invite/approve visitors per the assignment; authorized staff can issue the pass in this workflow.
    createdAppointment = await Appointment.create({
      visitor: visitor._id,
      organizationId: req.organizationId,
      host: host._id,
      purpose,
      appointmentDate,
      appointmentTime,
      status: 'approved',
    });

    const issued = await issuePassForAppointment({ appointment: createdAppointment, visitor, host, organizationId: req.organizationId });
    createdPass = issued.pass;

    return res.status(201).json({
      message: 'Visitor registered, appointment created, and pass issued',
      visitor,
      appointment: createdAppointment,
      pass: createdPass,
      email: issued.email,
    });
  } catch (error) {
    // Remove records created during a partially failed workflow.
    if (createdPass) await Pass.findOneAndDelete({ _id: createdPass._id, organizationId: req.organizationId }).catch(() => {});
    if (createdAppointment) await Appointment.findOneAndDelete({ _id: createdAppointment._id, organizationId: req.organizationId }).catch(() => {});
    if (createdVisitor) await Visitor.findOneAndDelete({ _id: createdVisitor._id, organizationId: req.organizationId }).catch(() => {});
    return res.status(500).json({ message: 'Could not complete visitor registration and pass issuance', error: error.message });
  }
};

// Approve a pending (usually visitor-requested) appointment and issue its pass.
const approveVisitorAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
      status: 'pending',
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Pending appointment not found' });
    }

    const visitor = await Visitor.findOne({ _id: appointment.visitor, organizationId: req.organizationId });
    if (!visitor) return res.status(404).json({ message: 'Visitor for this appointment was not found' });

    // Visitor-requested appointments have no host yet; the approving staff member becomes the host
    if (!appointment.host) appointment.host = req.user._id;
    const host = await User.findOne({ _id: appointment.host, organizationId: req.organizationId });
    if (!host) return res.status(400).json({ message: 'The appointment host was not found' });

    appointment.status = 'approved';
    await appointment.save();

    let issued;
    try {
      issued = await issuePassForAppointment({ appointment, visitor, host, organizationId: req.organizationId });
    } catch (error) {
      // Keep the request reviewable if the pass could not be generated
      appointment.status = 'pending';
      await appointment.save().catch(() => {});
      throw error;
    }

    return res.status(200).json({
      message: 'Appointment approved and visitor pass generated',
      appointment,
      pass: issued.pass,
      email: issued.email,
    });
  } catch (error) {
    console.error('Approve appointment error:', error);
    return res.status(500).json({ message: 'Unable to approve appointment' });
  }
};

const rejectVisitorAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
      status: 'pending',
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Pending appointment not found' });
    }

    appointment.status = 'rejected';
    appointment.rejectionReason = String(req.body.rejectionReason || '').trim() || 'Appointment rejected';
    await appointment.save();

    return res.status(200).json({ message: 'Appointment rejected successfully', appointment });
  } catch (error) {
    console.error('Reject visitor appointment error:', error);
    return res.status(500).json({ message: 'Unable to reject appointment' });
  }
};

module.exports = { registerAndIssue, approveVisitorAppointment, rejectVisitorAppointment };
