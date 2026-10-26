const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ['visitor-registration'],
    },
    // Only a SHA-256 hash of the code is stored, never the code itself
    codeHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    sentAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
// MongoDB removes expired OTP documents automatically
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
