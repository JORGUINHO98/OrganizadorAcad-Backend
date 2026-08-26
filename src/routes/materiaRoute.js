const express = require('express');
const router = express.Router();

const {
  getMaterias,
  getMateriaById,
  createMateria,
  updateMateria,
  deleteMateria,
  inscribirEstudiante,
  quitarEstudiante,
} = require('../controllers/materiaController');

const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

router.use(verifyToken);

// Ver: Docente ve las suyas, Estudiante ve solo donde está inscrito
router.get('/', getMaterias);
router.get('/:id', getMateriaById);

// Crear/editar/eliminar materia: solo Docente
router.post('/', checkRole(['Docente']), createMateria);
router.put('/:id', checkRole(['Docente']), updateMateria);
router.delete('/:id', checkRole(['Docente']), deleteMateria);

// Inscribir/desinscribir estudiantes: solo el Docente dueño de la materia
router.post('/:id/estudiantes', checkRole(['Docente']), inscribirEstudiante);
router.delete('/:id/estudiantes/:estudianteId', checkRole(['Docente']), quitarEstudiante);

module.exports = router;