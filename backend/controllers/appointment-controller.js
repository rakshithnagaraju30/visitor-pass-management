const mongoose = require('mongoose');
const Appointment = require('../models/appointment-model');
const Visitor = require('../models/visitor-model');
const User = require('../models/user-model');
const Organization = require('../models/organization-model');
const Pass = require('../models/pass-model');
const { createPassPdfBuffer } = require('../services/pass-document-service');
const { searchRegex, dateRangeFilter } = require('../utils/list-filters');

const APPOINTMENT_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];

// Create Appointment
const createAppointment = async (req, res) => {
  try {
    const payload = { ...req.body, organizationId: req.organizationId };
    if (req.user.role !== 'admin') payload.host = req.user._id;
    const visitor = await Visitor.findOne({ _id: payload.visitor, organizationId: req.organizationId });
    const host = await User.findOne({ _id: payload.host, organizationId: req.organizationId });
    if (!visitor || !host) return res.status(400).json({ message: 'Visitor and host must belong to your organization' });
    const appointment = await Appointment.create(payload);

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create appointment',
      error: error.message,
    });
  }
};

// Get All Appointments (supports ?search=&status=&from=&to=)
const getAppointments = async (req, res) => {
  try {
    const { search, status, from, to } = req.query;
    const filter = { organizationId: req.organizationId, ...dateRangeFilter('appointmentDate', from, to) };
    if (APPOINTMENT_STATUSES.includes(status)) filter.status = status;

    const regex = searchRegex(search);
    if (regex) {
      // Search matches the purpose or the visitor's name, email or phone
      const visitors = await Visitor.find({
        organizationId: req.organizationId,
        $or: [{ name: regex }, { email: regex }, { phone: regex }],
      }).select('_id');
      filter.$or = [{ purpose: regex }, { visitor: { $in: visitors.map((visitor) => visitor._id) } }];
    }

    const appointments = await Appointment.find(filter)
      .populate('visitor')
      .populate('host', 'name email role')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch appointments',
      error: error.message,
    });
  }
};

// Get Appointment By ID
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, organizationId: req.organizationId })
      .populate('visitor')
      .populate('host', 'name email role');

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
      });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch appointment',
      error: error.message,
    });
  }
};

// Update Appointment Status
const updateAppointmentStatus = async (req, res) => {
  try {
    if (!APPOINTMENT_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid appointment status' });
    }
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { status: req.body.status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found',
      });
    }

    res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update appointment',
      error: error.message,
    });
  }
};

// Visitor requests an appointment with an organization
const createVisitorAppointment = async (req, res) => {
  try {
    const organizationId = String(req.body.organizationId || '');
    const reason = String(req.body.reason || '').trim();
    const appointmentTime = String(req.body.appointmentTime || '').trim();
    const appointmentDate = new Date(req.body.appointmentDate);

    if (!organizationId || !reason || !appointmentTime || !req.body.appointmentDate) {
      return res.status(400).json({
        message: 'Organization, reason, appointment date and appointment time are required',
      });
    }
    if (Number.isNaN(appointmentDate.getTime())) return res.status(400).json({ message: 'Invalid appointment date' });
    if (appointmentDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({ message: 'Appointment date cannot be in the past' });
    }
    if (!mongoose.isValidObjectId(organizationId)) return res.status(400).json({ message: 'Invalid organization' });

    const organization = await Organization.findOne({ _id: organizationId, status: 'active' });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Each organization keeps its own Visitor record, linked to the visitor account by verified email
    const visitorUser = req.user;
    let visitor = await Visitor.findOne({ email: visitorUser.email, organizationId });
    if (!visitor) {
      visitor = await Visitor.create({
        name: visitorUser.name,
        email: visitorUser.email,
        phone: visitorUser.phone || 'Not provided',
        organizationId,
      });
    }

    const appointment = await Appointment.create({
      organizationId,
      visitor: visitor._id,
      purpose: reason,
      appointmentDate,
      appointmentTime,
      status: 'pending',
    });

    return res.status(201).json({
      message: 'Appointment request submitted successfully',
      appointment,
    });
  } catch (error) {
    console.error('Visitor appointment error:', error);
    return res.status(500).json({ message: 'Unable to create appointment' });
  }
};

const getPendingVisitorAppointments = async (req, res) => {
  try {
    // Only Admin and Employee can view pre-registered visitor requests
    if (!['admin', 'employee'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only admin or employee can view visitor appointments',
      });
    }

    const appointments = await Appointment.find({
      organizationId: req.organizationId,
      status: 'pending',
    })
      .populate('visitor', 'name email phone')
      .sort({
        appointmentDate: 1,
        appointmentTime: 1,
      });

    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Get pending visitor appointments error:', error);
    return res.status(500).json({ message: 'Unable to fetch visitor appointments' });
  }
};

// Visitor Record ids that belong to the logged-in visitor across all organizations
const visitorRecordIds = async (user) => {
  const records = await Visitor.find({ email: user.email }).select('_id');
  return records.map((record) => record._id);
};

const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      visitor: { $in: await visitorRecordIds(req.user) },
    })
      .populate('visitor', 'name email phone')
      .populate('host', 'name email')
      .populate('organizationId', 'name type')
      .sort({ appointmentDate: -1 })
      .lean();

    // Attach the issued pass so the visitor can show the QR code or download the PDF
    const passes = await Pass.find({ appointment: { $in: appointments.map((item) => item._id) } })
      .select('passNumber qrCode status validFrom validUntil appointment')
      .lean();
    const passByAppointment = new Map(passes.map((pass) => [String(pass.appointment), pass]));

    return res.status(200).json(appointments.map((appointment) => ({
      ...appointment,
      pass: passByAppointment.get(String(appointment._id)) || null,
    })));
  } catch (error) {
    console.error('Get my appointments error:', error);
    return res.status(500).json({ message: 'Unable to fetch appointments', error: error.message });
  }
};

const cancelMyAppointment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid appointment ID' });
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      visitor: { $in: await visitorRecordIds(req.user) },
    });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (!['pending', 'approved'].includes(appointment.status)) {
      return res.status(400).json({ message: `A ${appointment.status} appointment cannot be cancelled` });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    // An issued pass must not stay usable after cancellation
    await Pass.updateMany({ appointment: appointment._id, status: 'active' }, { status: 'revoked' });

    return res.json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return res.status(500).json({ message: 'Unable to cancel appointment' });
  }
};

const getMyPassPdf = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid appointment ID' });
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      visitor: { $in: await visitorRecordIds(req.user) },
    });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const pass = await Pass.findOne({ appointment: appointment._id });
    if (!pass) return res.status(404).json({ message: 'No pass has been issued for this appointment yet' });

    const [visitor, host] = await Promise.all([
      Visitor.findById(appointment.visitor),
      User.findById(appointment.host).select('name'),
    ]);
    const pdf = await createPassPdfBuffer(pass, visitor, appointment, host);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pass.passNumber}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    console.error('Visitor pass PDF error:', error);
    return res.status(500).json({ message: 'Failed to generate pass PDF' });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  createVisitorAppointment,
  getPendingVisitorAppointments,
  getMyAppointments,
  cancelMyAppointment,
  getMyPassPdf,
};
