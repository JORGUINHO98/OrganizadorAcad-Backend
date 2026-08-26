const mongoose = require('mongoose');
const tareaSchema = require('./tarea');

const materiaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    // El docente ya NO se guarda como texto suelto: se obtiene siempre
    // vía populate() desde usuarioId, para que nunca quede desactualizado.
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Estudiantes inscritos/matriculados en esta materia.
    estudiantes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    // Las tareas siguen embebidas en Materia.
    tareas: {
      type: [tareaSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Materia', materiaSchema);