const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      required: false,
    },
  },

  {
    timestamps: true,
  }
);

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;