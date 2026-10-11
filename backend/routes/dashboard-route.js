const express = require('express');
const { getDashboardStats } = require('../controllers/dashboard-controller');
const { requireAuth } = require('../middleware/auth-middleware');
const router = express.Router();
router.get('/stats', requireAuth, getDashboardStats);
module.exports = router;
