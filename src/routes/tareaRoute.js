const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/Uploadmiddleware');
const {
  getTareas,
  getTareasPendientes,
  addTarea,
  updateTarea,
  toggleCompletada,
  deleteTarea,
  subirAdjunto,
  eliminarAdjunto,
} = require('../controllers/tareaController');

router.use(verifyToken);

// Ver: ambos roles (cada uno filtrado según su relación con la materia)
router.get('/', getTareas);
router.get('/pendientes', getTareasPendientes);

// Crear/editar/eliminar tarea: solo Docente
router.post('/:materiaId', checkRole(['Docente']), addTarea);
router.put('/:materiaId/:tareaId', checkRole(['Docente']), updateTarea);
router.delete('/:materiaId/:tareaId', checkRole(['Docente']), deleteTarea);

// Marcar/desmarcar completada: ambos roles (cada uno debe tener acceso a la materia)
router.patch('/:materiaId/:tareaId/completar', toggleCompletada);

// Adjuntar/eliminar evidencia (PDF o Word): solo Estudiante inscrito
// El campo del formulario debe llamarse "archivo" (form-data).
router.post(
  '/:materiaId/:tareaId/adjunto',
  checkRole(['Estudiante']),
  upload.single('archivo'),
  subirAdjunto
);
router.delete('/:materiaId/:tareaId/adjunto', checkRole(['Estudiante']), eliminarAdjunto);

module.exports = router;