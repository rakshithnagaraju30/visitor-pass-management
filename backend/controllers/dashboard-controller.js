const Visitor = require('../models/visitor-model');
const Appointment = require('../models/appointment-model');
const Pass = require('../models/pass-model');
const CheckLog = require('../models/check-log-model');

const getDashboardStats = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const [visitors, appointments, activePasses, checkLogs, pendingAppointments] = await Promise.all([
      Visitor.countDocuments({ organizationId }),
      Appointment.countDocuments({ organizationId }),
      Pass.countDocuments({ organizationId, status: 'active' }),
      CheckLog.countDocuments({ organizationId }),
      Appointment.countDocuments({ organizationId, status: 'pending' }),
    ]);
    return res.json({ visitors, appointments, activePasses, checkLogs, pendingAppointments });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard statistics', error: error.message });
  }
};
module.exports = { getDashboardStats };
