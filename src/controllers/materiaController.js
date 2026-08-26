const mongoose = require('mongoose');
const Materia = require('../models/materia');
const User = require('../models/user');

const esEstudianteInscrito = (materia, usuarioId) =>
  materia.estudiantes.some((id) => id.toString() === usuarioId);

// Campos del docente/estudiante que sí queremos exponer (nunca el password)
const CAMPOS_USUARIO_PUBLICOS = 'username email';

// ---------------------------------------------
// GET /api/materias
// Docente: ve solo las materias que él creó.
// Estudiante: ve solo las materias donde está inscrito.
// ---------------------------------------------
const getMaterias = async (req, res) => {
  try {
    const filtro = req.usuario.rolNombre === 'Docente'
      ? { usuarioId: req.usuario.id }
      : { estudiantes: req.usuario.id };

    const materias = await Materia.find(filtro)
      .populate('usuarioId', CAMPOS_USUARIO_PUBLICOS);

    res.status(200).json(materias);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// GET /api/materias/:id
// Docente: solo si es el dueño. Estudiante: solo si está inscrito.
// ---------------------------------------------
const getMateriaById = async (req, res) => {
  try {
    const materia = await Materia.findById(req.params.id)
      .populate('usuarioId', CAMPOS_USUARIO_PUBLICOS)
      .populate('estudiantes', CAMPOS_USUARIO_PUBLICOS);

    if (!materia) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }

    if (req.usuario.rolNombre === 'Docente') {
      if (materia.usuarioId._id.toString() !== req.usuario.id) {
        return res.status(403).json({ mensaje: 'No tienes acceso a esta materia' });
      }
    } else {
      const inscrito = materia.estudiantes.some((e) => e._id.toString() === req.usuario.id);
      if (!inscrito) {
        return res.status(403).json({ mensaje: 'No estás inscrito en esta materia' });
      }
    }

    res.status(200).json(materia);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// POST /api/materias
// Solo Docente. usuarioId = el docente que la crea.
// Ya no se recibe "docente" como texto: sale de populate().
// ---------------------------------------------
const createMateria = async (req, res) => {
  try {
    const { nombre } = req.body;

    const nuevaMateria = new Materia({
      nombre,
      usuarioId: req.usuario.id,
    });

    const materiaGuardada = await nuevaMateria.save();
    await materiaGuardada.populate('usuarioId', CAMPOS_USUARIO_PUBLICOS);

    res.status(201).json(materiaGuardada);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// PUT /api/materias/:id — solo el Docente dueño
// Ya no se puede editar "docente" (ya no existe ese campo).
// ---------------------------------------------
const updateMateria = async (req, res) => {
  try {
    const { nombre } = req.body;

    const materia = await Materia.findById(req.params.id);
    if (!materia) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }
    if (materia.usuarioId.toString() !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes acceso a esta materia' });
    }

    if (nombre !== undefined) materia.nombre = nombre;

    const materiaActualizada = await materia.save();
    await materiaActualizada.populate('usuarioId', CAMPOS_USUARIO_PUBLICOS);

    res.status(200).json(materiaActualizada);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// DELETE /api/materias/:id — solo el Docente dueño
// ---------------------------------------------
const deleteMateria = async (req, res) => {
  try {
    const materia = await Materia.findById(req.params.id);
    if (!materia) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }
    if (materia.usuarioId.toString() !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes acceso a esta materia' });
    }

    await materia.deleteOne();
    res.status(200).json({ mensaje: 'Materia eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// POST /api/materias/:id/estudiantes
// Inscribe a un estudiante en la materia. Solo el Docente dueño.
// Body: { estudianteId }
// ---------------------------------------------
const inscribirEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.body;

    if (!estudianteId || !mongoose.Types.ObjectId.isValid(estudianteId)) {
      return res.status(400).json({ mensaje: 'estudianteId inválido' });
    }

    const materia = await Materia.findById(req.params.id);
    if (!materia) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }
    if (materia.usuarioId.toString() !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes acceso a esta materia' });
    }

    const estudiante = await User.findById(estudianteId);
    if (!estudiante) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado' });
    }
    if (estudiante.rol?.nombre !== 'Estudiante') {
      return res.status(400).json({ mensaje: 'El usuario indicado no tiene rol de Estudiante' });
    }

    if (esEstudianteInscrito(materia, estudianteId)) {
      return res.status(400).json({ mensaje: 'El estudiante ya está inscrito en esta materia' });
    }

    materia.estudiantes.push(estudianteId);
    await materia.save();
    await materia.populate('estudiantes', CAMPOS_USUARIO_PUBLICOS);

    res.status(200).json({ mensaje: 'Estudiante inscrito correctamente', materia });
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// DELETE /api/materias/:id/estudiantes/:estudianteId
// Desinscribe a un estudiante. Solo el Docente dueño.
// ---------------------------------------------
const quitarEstudiante = async (req, res) => {
  try {
    const materia = await Materia.findById(req.params.id);
    if (!materia) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }
    if (materia.usuarioId.toString() !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes acceso a esta materia' });
    }

    const { estudianteId } = req.params;
    const estabaInscrito = esEstudianteInscrito(materia, estudianteId);
    if (!estabaInscrito) {
      return res.status(404).json({ mensaje: 'Ese estudiante no está inscrito en esta materia' });
    }

    materia.estudiantes = materia.estudiantes.filter((id) => id.toString() !== estudianteId);
    await materia.save();

    res.status(200).json({ mensaje: 'Estudiante desinscrito correctamente', materia });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  getMaterias,
  getMateriaById,
  createMateria,
  updateMateria,
  deleteMateria,
  inscribirEstudiante,
  quitarEstudiante,
};