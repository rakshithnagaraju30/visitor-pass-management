const Appointment = require('../models/appointment-model');

// Create Appointment
const createAppointment = async (req, res) => {
  try {
    const payload = { ...req.body, organizationId: req.organizationId };
    if (req.user.role !== 'admin') payload.host = req.user._id;
    const visitor = await require('../models/visitor-model').findOne({ _id: payload.visitor, organizationId: req.organizationId });
    const host = await require('../models/user-model').findOne({ _id: payload.host, organizationId: req.organizationId });
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

// Get All Appointments
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ organizationId: req.organizationId })
      .populate('visitor')
      .populate('host', 'name email role');

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

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
};