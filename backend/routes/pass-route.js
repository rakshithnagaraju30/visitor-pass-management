const express = require('express');
const { getPasses, getPassById, updatePassStatus, getPassPdf } = require('../controllers/pass-controller');
const { allowRoles } = require('../middleware/auth-middleware');
const router = express.Router();
router.get('/', getPasses);
router.get('/:id/pdf', getPassPdf);
router.get('/:id', getPassById);
router.put('/:id/status', allowRoles('admin', 'security'), updatePassStatus);
module.exports = router;
