const express = require('express');
const { registerAndIssue } = require('../controllers/visit-workflow-controller');
const { requireAuth, allowRoles } = require('../middleware/auth-middleware');
const router = express.Router();
router.post('/register-and-issue', requireAuth, allowRoles('admin', 'employee', 'security'), registerAndIssue);
module.exports = router;
