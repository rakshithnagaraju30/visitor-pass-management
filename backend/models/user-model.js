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
      enum: ['admin', 'security', 'employee'],
    },
    phone: {
      type: String,
      required: false,
    },
    
    organizationId: {
      type: require("mongoose").Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

  },

  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;