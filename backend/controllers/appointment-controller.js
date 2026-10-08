const Appointment = require('../models/appointment-model');

// Create Appointment
const createAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);

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
    const appointments = await Appointment.find()
      .populate('visitor')
      .populate('host');

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
    const appointment = await Appointment.findById(req.params.id)
      .populate('visitor')
      .populate('host');

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
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
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