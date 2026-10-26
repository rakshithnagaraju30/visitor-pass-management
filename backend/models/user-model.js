const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'security', 'employee', 'visitor'],
    },
    phone: {
      type: String,
      required: false,
    },
    // Visitors must confirm their email with an OTP; accounts created before OTP have no value and stay usable
    emailVerified: {
      type: Boolean,
      required: false,
    },

    organizationId: {
      type: require("mongoose").Schema.Types.ObjectId,
      ref: "Organization",
      required: function () {
        return this.role !== 'visitor';
      },
      index: true,
    },

  },

  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;