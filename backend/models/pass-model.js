const mongoose = require('mongoose');

const passSchema = new mongoose.Schema(
  {
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visitor',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    passNumber: {
      type: String,
      required: true,
      unique: true,
    },
    qrCode: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
      required: false,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'used', 'expired', 'revoked'],
      default: 'active',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

const Pass = mongoose.model('Pass', passSchema);

module.exports = Pass;