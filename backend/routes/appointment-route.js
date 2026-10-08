const express = require('express');

const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
} = require('../controllers/appointment-controller');

const router = express.Router();

router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id/status', updateAppointmentStatus);

module.exports = router;