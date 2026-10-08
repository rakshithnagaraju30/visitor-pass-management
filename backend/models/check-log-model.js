const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema(
  {
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visitor',
      required: true,
    },
    pass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pass',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['check-in', 'check-out'],
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  }
);

const CheckLog = mongoose.model('CheckLog', checkLogSchema);

module.exports = CheckLog;