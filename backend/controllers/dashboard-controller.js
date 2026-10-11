const Visitor = require('../models/visitor-model');
const Appointment = require('../models/appointment-model');
const Pass = require('../models/pass-model');
const CheckLog = require('../models/check-log-model');

const getDashboardStats = async (req, res) => {
  try {
    const [visitors, appointments, activePasses, checkLogs, pendingAppointments] = await Promise.all([
      Visitor.countDocuments(),
      Appointment.countDocuments(),
      Pass.countDocuments({ status: 'active' }),
      CheckLog.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
    ]);
    return res.json({ visitors, appointments, activePasses, checkLogs, pendingAppointments });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard statistics', error: error.message });
  }
};
module.exports = { getDashboardStats };
