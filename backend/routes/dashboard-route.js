const express = require('express');
const { getDashboardStats, getDashboardAnalytics } = require('../controllers/dashboard-controller');
const { requireAuth, allowRoles } = require('../middleware/auth-middleware');
const router = express.Router();
router.get('/stats', requireAuth, allowRoles('admin', 'employee', 'security'), getDashboardStats);
router.get('/analytics', requireAuth, allowRoles('admin'), getDashboardAnalytics);
module.exports = router;
