const express = require('express');

const {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
} = require('../controllers/visitor-controller');

const router = express.Router();

router.post('/', createVisitor);
router.get('/', getVisitors);
router.get('/:id', getVisitorById);
router.put('/:id', updateVisitor);

module.exports = router;