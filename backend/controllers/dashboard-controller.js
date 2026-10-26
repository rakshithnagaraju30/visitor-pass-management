const Visitor = require('../models/visitor-model');
const Appointment = require('../models/appointment-model');
const Pass = require('../models/pass-model');
const CheckLog = require('../models/check-log-model');

const ANALYTICS_RANGES = [7, 30, 90];

// Passes whose most recent log is a check-in, i.e. visitors still on site
const countVisitorsInside = async (organizationId) => {
  const [result] = await CheckLog.aggregate([
    { $match: { organizationId } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$pass', lastAction: { $first: '$action' } } },
    { $match: { lastAction: 'check-in' } },
    { $count: 'inside' },
  ]);
  return result?.inside || 0;
};

const getDashboardStats = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const [visitors, appointments, activePasses, checkLogs, pendingAppointments, currentlyInside] = await Promise.all([
      Visitor.countDocuments({ organizationId }),
      Appointment.countDocuments({ organizationId }),
      Pass.countDocuments({ organizationId, status: 'active' }),
      CheckLog.countDocuments({ organizationId }),
      Appointment.countDocuments({ organizationId, status: 'pending' }),
      countVisitorsInside(organizationId),
    ]);
    return res.json({ visitors, appointments, activePasses, checkLogs, pendingAppointments, currentlyInside });
  } catch (error) {
    console.error('Dashboard statistics error:', error);
    return res.status(500).json({ message: 'Unable to fetch dashboard statistics' });
  }
};

const resolveTimeZone = (timeZone) => {
  try {
    Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    return 'UTC';
  }
};

// YYYY-MM-DD for every day in the range, in the requested time zone
const dayKeys = (days, timeZone) => {
  const format = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const keys = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    keys.push(format.format(new Date(Date.now() - offset * 24 * 60 * 60 * 1000)));
  }
  return keys;
};

// GET /dashboard/analytics?days=7|30|90&tz=Asia/Kolkata
const getDashboardAnalytics = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const days = ANALYTICS_RANGES.includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const timezone = resolveTimeZone(String(req.query.tz || 'UTC'));
    const keys = dayKeys(days, timezone);
    // Coarse index-friendly bound with a one-day margin, then an exact cut at the first local day
    const since = new Date(Date.now() - (days + 1) * 24 * 60 * 60 * 1000);
    const inRange = (field, extra = {}) => [
      { $match: { organizationId, [field]: { $gte: since }, ...extra } },
      { $match: { $expr: { $gte: [{ $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone } }, keys[0]] } } },
    ];
    const checkIns = inRange('timestamp', { action: 'check-in' });

    const [dailyCheckIns, hourlyCheckIns, statusCounts, hostCounts, durations] = await Promise.all([
      CheckLog.aggregate([
        ...checkIns,
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone } }, checkIns: { $sum: 1 }, visitors: { $addToSet: '$visitor' } } },
      ]),
      CheckLog.aggregate([
        ...checkIns,
        { $group: { _id: { $hour: { date: '$timestamp', timezone } }, checkIns: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        ...inRange('createdAt'),
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        ...inRange('createdAt', { host: { $ne: null } }),
        { $group: { _id: '$host', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'host' } },
        { $project: { count: 1, name: { $ifNull: [{ $arrayElemAt: ['$host.name', 0] }, 'Unknown'] } } },
      ]),
      // Visit length per pass: first check-in to last check-out
      CheckLog.aggregate([
        ...inRange('timestamp'),
        { $group: {
          _id: '$pass',
          checkIn: { $min: { $cond: [{ $eq: ['$action', 'check-in'] }, '$timestamp', null] } },
          checkOut: { $max: { $cond: [{ $eq: ['$action', 'check-out'] }, '$timestamp', null] } },
        } },
        { $match: { checkIn: { $ne: null }, checkOut: { $ne: null } } },
        { $project: { minutes: { $divide: [{ $subtract: ['$checkOut', '$checkIn'] }, 60000] } } },
        { $match: { minutes: { $gte: 0 } } },
        { $group: { _id: null, average: { $avg: '$minutes' }, visits: { $sum: 1 } } },
      ]),
    ]);

    const dailyByKey = new Map(dailyCheckIns.map((day) => [day._id, day]));
    const visitsPerDay = keys.map((date) => ({
      date,
      checkIns: dailyByKey.get(date)?.checkIns || 0,
      visitors: dailyByKey.get(date)?.visitors.length || 0,
    }));
    const uniqueVisitors = new Set(dailyCheckIns.flatMap((day) => day.visitors.map(String))).size;

    const hourlyByHour = new Map(hourlyCheckIns.map((hour) => [hour._id, hour.checkIns]));
    const checkInsByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, checkIns: hourlyByHour.get(hour) || 0 }));

    const statusByName = Object.fromEntries(statusCounts.map((status) => [status._id, status.count]));
    const appointmentStatus = ['pending', 'approved', 'completed', 'rejected', 'cancelled']
      .map((status) => ({ status, count: statusByName[status] || 0 }));
    const decided = (statusByName.approved || 0) + (statusByName.completed || 0) + (statusByName.rejected || 0);

    return res.json({
      days,
      timezone,
      totals: {
        checkIns: visitsPerDay.reduce((sum, day) => sum + day.checkIns, 0),
        uniqueVisitors,
        appointments: appointmentStatus.reduce((sum, item) => sum + item.count, 0),
        approvalRate: decided ? Math.round((((statusByName.approved || 0) + (statusByName.completed || 0)) / decided) * 100) : null,
        averageVisitMinutes: durations[0] ? Math.round(durations[0].average) : null,
      },
      visitsPerDay,
      checkInsByHour,
      appointmentStatus,
      topHosts: hostCounts.map((host) => ({ name: host.name, count: host.count })),
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return res.status(500).json({ message: 'Unable to fetch dashboard analytics' });
  }
};

module.exports = { getDashboardStats, getDashboardAnalytics };
