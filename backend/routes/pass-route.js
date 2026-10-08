const express = require('express');

const {
  createPass,
  getPasses,
  getPassById,
  updatePassStatus,
} = require('../controllers/pass-controller');

const router = express.Router();

router.post('/', createPass);
router.get('/', getPasses);
router.get('/:id', getPassById);
router.put('/:id/status', updatePassStatus);

module.exports = router;