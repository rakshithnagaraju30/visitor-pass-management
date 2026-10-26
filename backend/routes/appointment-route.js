const express = require('express');
const { requireAuth, allowRoles } = require('../middleware/auth-middleware');

const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  createVisitorAppointment,
  getPendingVisitorAppointments,
  getMyAppointments,
  cancelMyAppointment,
  getMyPassPdf,
} = require('../controllers/appointment-controller');

const router = express.Router();

const staffAccess = [requireAuth, allowRoles('admin', 'employee', 'security')];
const visitorAccess = [requireAuth, allowRoles('visitor')];

router.post('/', ...staffAccess, createAppointment);
router.get('/', ...staffAccess, getAppointments);
router.get('/pending-visitors', ...staffAccess, getPendingVisitorAppointments);

router.post('/visitor', ...visitorAccess, createVisitorAppointment);
router.get('/my-appointments', ...visitorAccess, getMyAppointments);
router.patch('/my-appointments/:id/cancel', ...visitorAccess, cancelMyAppointment);
router.get('/my-appointments/:id/pass-pdf', ...visitorAccess, getMyPassPdf);

router.get('/:id', ...staffAccess, getAppointmentById);
router.put('/:id/status', ...staffAccess, updateAppointmentStatus);

module.exports = router;
