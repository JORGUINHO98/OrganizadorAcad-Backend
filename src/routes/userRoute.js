const express = require('express');
const router = express.Router();

const {
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const verifyToken = require('../middleware/verifyToken');


// Cada usuario solo puede ver/editar/borrar su propia cuenta

router.use(verifyToken);

router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;