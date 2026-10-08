const express = require('express');

const {
  createCheckLog,
  getCheckLogs,
  getCheckLogById,
} = require('../controllers/check-log-controller');

const router = express.Router();

router.post('/', createCheckLog);
router.get('/', getCheckLogs);
router.get('/:id', getCheckLogById);

module.exports = router;