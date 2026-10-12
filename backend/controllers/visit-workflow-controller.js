const crypto = require('crypto');
const mongoose = require('mongoose');
const Visitor = require('../models/visitor-model');
const Appointment = require('../models/appointment-model');
const Pass = require('../models/pass-model');
const User = require('../models/user-model');
const { sendVisitorPassEmail } = require('../services/email-service');

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

    const passNumber = `VPM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const validFrom = new Date(appointmentDate);
    const validUntil = new Date(appointmentDate);
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) validFrom.setHours(hours, minutes, 0, 0);
    validUntil.setTime(validFrom.getTime() + 8 * 60 * 60 * 1000);

    const QRCode = require('qrcode');
    const qrPayload = JSON.stringify({ passNumber, appointmentId: String(createdAppointment._id) });
    const qrCode = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M', margin: 1, width: 280 });
    // Store the active pass and track the email delivery status.
    createdPass = await Pass.create({
      visitor: visitor._id,
      organizationId: req.organizationId,
      appointment: createdAppointment._id,
      passNumber,
      qrCode,
      pdfUrl: `/api/passes/${passNumber}/pdf`,
      validFrom,
      validUntil,
      status: 'active',
      issuedBy: host._id,
      emailStatus: 'pending',
    });

    let emailResult;
    try {
      // Email delivery is best-effort and must not block pass issuance.
      emailResult = await sendVisitorPassEmail({ pass: createdPass, visitor, appointment: createdAppointment, host });
    } catch (emailError) {
      emailResult = { status: 'failed', message: emailError.message };
    }
    createdPass.emailStatus = emailResult.status;
    await createdPass.save();

    return res.status(201).json({
      message: 'Visitor registered, appointment created, and pass issued',
      visitor,
      appointment: createdAppointment,
      pass: createdPass,
      email: emailResult,
    });
  } catch (error) {
    // Remove records created during a partially failed workflow.
    if (createdPass) await Pass.findOneAndDelete({ _id: createdPass._id, organizationId: req.organizationId }).catch(() => {});
    if (createdAppointment) await Appointment.findOneAndDelete({ _id: createdAppointment._id, organizationId: req.organizationId }).catch(() => {});
    if (createdVisitor) await Visitor.findOneAndDelete({ _id: createdVisitor._id, organizationId: req.organizationId }).catch(() => {});
    return res.status(500).json({ message: 'Could not complete visitor registration and pass issuance', error: error.message });
  }
};

module.exports = { registerAndIssue };
