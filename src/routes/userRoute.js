const express = require('express');
const router = express.Router();

const {
  getUserById,
  updateUser,
  deleteUser,
  buscarEstudiantes,
} = require('../controllers/userController');

const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

// Cada usuario solo puede ver/editar/borrar su propia cuenta

router.use(verifyToken);

// IMPORTANTE: /buscar va ANTES de /:id, si no Express interpreta
// "buscar" como si fuera un :id y nunca llega a esta función.
router.get('/buscar', checkRole(['Docente']), buscarEstudiantes);

router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
