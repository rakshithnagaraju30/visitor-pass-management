const express = require('express');

const {
  createUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
} = require('../controllers/user-controller');

const router = express.Router();

router.post('/', createUser);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;