const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visitor',
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: false,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
  },

  {
    timestamps: true,
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;