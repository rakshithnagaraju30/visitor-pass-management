const express = require('express');
const { registerAndIssue, approveVisitorAppointment, rejectVisitorAppointment } = require('../controllers/visit-workflow-controller');
const { requireAuth, allowRoles } = require('../middleware/auth-middleware');
const router = express.Router();
router.post('/register-and-issue', requireAuth, allowRoles('admin', 'employee', 'security'), registerAndIssue);
router.patch('/appointments/:id/approve', requireAuth, allowRoles('admin', 'employee'), approveVisitorAppointment);
router.patch('/appointments/:id/reject', requireAuth, allowRoles('admin', 'employee'), rejectVisitorAppointment);
module.exports = router;
