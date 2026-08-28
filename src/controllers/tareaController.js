const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Materia = require('../models/materia');

const validarObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const esEstudianteInscrito = (materia, usuarioId) =>
  materia.estudiantes.some((id) => id.toString() === usuarioId);

// Para acciones de Docente: la materia DEBE ser suya.
const buscarMateriaDelDocente = async (materiaId, usuarioId) => {
  if (!validarObjectId(materiaId)) {
    return { error: 400, mensaje: 'ID de materia inválido' };
  }
  const materia = await Materia.findOne({ _id: materiaId, usuarioId });
  if (!materia) {
    return { error: 404, mensaje: 'Materia no encontrada o no te pertenece' };
  }
  return { materia };
};

// Para acciones de Estudiante: debe existir Y estar inscrito.
const buscarMateriaDelEstudiante = async (materiaId, usuarioId) => {
  if (!validarObjectId(materiaId)) {
    return { error: 400, mensaje: 'ID de materia inválido' };
  }
  const materia = await Materia.findById(materiaId);
  if (!materia) {
    return { error: 404, mensaje: 'Materia no encontrada' };
  }
  if (!esEstudianteInscrito(materia, usuarioId)) {
    return { error: 403, mensaje: 'No estás inscrito en esta materia' };
  }
  return { materia };
};

// ---------------------------------------------
// GET /api/tareas
// Docente: solo tareas de SUS materias.
// Estudiante: solo tareas de las materias donde está inscrito.
// Filtros opcionales: materiaId, completada, prioridad
// ---------------------------------------------
const getTareas = async (req, res, filtros = {}) => {
  try {
    const { materiaId, completada, prioridad } = { ...req.query, ...filtros };

    const filtroMateria = req.usuario.rolNombre === 'Docente'
      ? { usuarioId: req.usuario.id }
      : { estudiantes: req.usuario.id };

    if (materiaId) {
      if (!validarObjectId(materiaId)) {
        return res.status(400).json({ mensaje: 'ID de materia inválido' });
      }
      filtroMateria._id = materiaId;
    }

    const materias = await Materia.find(filtroMateria).lean();

    const tareasPorId = new Map();

    materias.forEach((materia) => {
      materia.tareas
        .filter((tarea) => {
          if (completada !== undefined && tarea.completada !== (completada === 'true')) {
            return false;
          }
          if (prioridad && tarea.prioridad !== prioridad) {
            return false;
          }
          return true;
        })
        .forEach((tarea) => {
          const tareaConMateria = {
            ...tarea,
            materiaId: materia._id,
            materiaNombre: materia.nombre,
          };
          const tareaAnterior = tareasPorId.get(String(tarea._id));

          if (!tareaAnterior || new Date(tarea.updatedAt) > new Date(tareaAnterior.updatedAt)) {
            tareasPorId.set(String(tarea._id), tareaConMateria);
          }
        });
    });

    const tareas = [...tareasPorId.values()];

    return res.status(200).json(tareas);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const getTareasPendientes = async (req, res) => {
  return getTareas(req, res, { completada: 'false' });
};

// ---------------------------------------------
// POST /api/tareas/:materiaId — solo Docente dueño
// ---------------------------------------------
const addTarea = async (req, res) => {
  try {
    const { materia, error, mensaje } = await buscarMateriaDelDocente(
      req.params.materiaId,
      req.usuario.id
    );
    if (error) return res.status(error).json({ mensaje });

    const { titulo, descripcion, fechaEntrega, prioridad } = req.body;
    materia.tareas.push({ titulo, descripcion, fechaEntrega, prioridad });
    await materia.save();

    const tareaCreada = materia.tareas[materia.tareas.length - 1];
    return res.status(201).json({
      mensaje: 'Tarea creada correctamente',
      materiaId: materia._id,
      materiaNombre: materia.nombre,
      tarea: tareaCreada,
    });
  } catch (error) {
    return res.status(400).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// PUT /api/tareas/:materiaId/:tareaId — solo Docente dueño
// ---------------------------------------------
const updateTarea = async (req, res) => {
  try {
    const { materia, error, mensaje } = await buscarMateriaDelDocente(
      req.params.materiaId,
      req.usuario.id
    );
    if (error) return res.status(error).json({ mensaje });

    const tarea = materia.tareas.id(req.params.tareaId);
    if (!tarea) {
      return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    }

    const { titulo, descripcion, fechaEntrega, prioridad, completada } = req.body;
    if (titulo !== undefined) tarea.titulo = titulo;
    if (descripcion !== undefined) tarea.descripcion = descripcion;
    if (fechaEntrega !== undefined) tarea.fechaEntrega = fechaEntrega;
    if (prioridad !== undefined) tarea.prioridad = prioridad;
    if (completada !== undefined) tarea.completada = completada;

    await materia.save();

    return res.status(200).json({
      mensaje: 'Tarea actualizada correctamente',
      materiaId: materia._id,
      materiaNombre: materia.nombre,
      tarea,
    });
  } catch (error) {
    return res.status(400).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// PATCH /api/tareas/:materiaId/:tareaId/completar
// Docente: debe ser dueño. Estudiante: debe estar inscrito.
// ---------------------------------------------
const toggleCompletada = async (req, res) => {
  try {
    const resultado = req.usuario.rolNombre === 'Docente'
      ? await buscarMateriaDelDocente(req.params.materiaId, req.usuario.id)
      : await buscarMateriaDelEstudiante(req.params.materiaId, req.usuario.id);

    const { materia, error, mensaje } = resultado;
    if (error) return res.status(error).json({ mensaje });

    const tarea = materia.tareas.id(req.params.tareaId);
    if (!tarea) {
      return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    }

    tarea.completada = !tarea.completada;
    await materia.save();

    return res.status(200).json({
      mensaje: 'Estado de tarea actualizado correctamente',
      materiaId: materia._id,
      materiaNombre: materia.nombre,
      tarea,
    });
  } catch (error) {
    return res.status(400).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// DELETE /api/tareas/:materiaId/:tareaId — solo Docente dueño
// ---------------------------------------------
const deleteTarea = async (req, res) => {
  try {
    const { materia, error, mensaje } = await buscarMateriaDelDocente(
      req.params.materiaId,
      req.usuario.id
    );
    if (error) return res.status(error).json({ mensaje });

    const tarea = materia.tareas.id(req.params.tareaId);
    if (!tarea) {
      return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    }

    tarea.deleteOne();
    await materia.save();

    return res.status(200).json({ mensaje: 'Tarea eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// POST /api/tareas/:materiaId/:tareaId/adjunto
// Solo Estudiante, y debe estar inscrito en la materia.
// ---------------------------------------------
const subirAdjunto = async (req, res) => {
  try {
    const { materia, error, mensaje } = await buscarMateriaDelEstudiante(
      req.params.materiaId,
      req.usuario.id
    );

    if (error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(error).json({ mensaje });
    }

    const tarea = materia.tareas.id(req.params.tareaId);
    if (!tarea) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    }

    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se recibió ningún archivo' });
    }

    if (!req.file.originalname || !req.file.filename || !req.file.mimetype || !req.file.size) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ mensaje: 'El archivo recibido no contiene metadata válida' });
    }

    if (tarea.archivoAdjunto?.nombreArchivo) {
      const rutaAnterior = path.join(__dirname, '..', '..', 'uploads', tarea.archivoAdjunto.nombreArchivo);
      fs.unlink(rutaAnterior, () => {});
    }

    tarea.archivoAdjunto = {
      nombreOriginal: req.file.originalname,
      nombreArchivo: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      tipo: req.file.mimetype,
      tamano: req.file.size,
      fechaSubida: new Date(),
    };

    await materia.save();

    return res.status(200).json({
      mensaje: 'Archivo adjuntado correctamente',
      materiaId: materia._id,
      tarea,
    });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// DELETE /api/tareas/:materiaId/:tareaId/adjunto
// Solo Estudiante, y debe estar inscrito en la materia.
// ---------------------------------------------
const eliminarAdjunto = async (req, res) => {
  try {
    const { materia, error, mensaje } = await buscarMateriaDelEstudiante(
      req.params.materiaId,
      req.usuario.id
    );
    if (error) return res.status(error).json({ mensaje });

    const tarea = materia.tareas.id(req.params.tareaId);
    if (!tarea) {
      return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    }

    if (!tarea.archivoAdjunto?.nombreArchivo) {
      return res.status(404).json({ mensaje: 'Esta tarea no tiene ningún archivo adjunto' });
    }

    const rutaArchivo = path.join(__dirname, '..', '..', 'uploads', tarea.archivoAdjunto.nombreArchivo);
    fs.unlink(rutaArchivo, () => {});

    tarea.archivoAdjunto = undefined;
    await materia.save();

    return res.status(200).json({ mensaje: 'Archivo eliminado correctamente', tarea });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  getTareas,
  getTareasPendientes,
  addTarea,
  updateTarea,
  toggleCompletada,
  deleteTarea,
  subirAdjunto,
  eliminarAdjunto,
};