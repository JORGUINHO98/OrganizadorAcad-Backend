const mongoose = require('mongoose');

const tareaSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
    },
    fechaEntrega: {
      type: Date,
      required: true,
    },
    prioridad: {
      type: String,
      enum: ['alta', 'media', 'baja'],
      default: 'media',
    },
    completada: {
      type: Boolean,
      default: false,
    },
    // Evidencia de entrega: PDF o Word que el estudiante sube al completar la tarea.
    archivoAdjunto: {
      nombreOriginal: { type: String, default: null },
      nombreArchivo: { type: String, default: null }, // nombre real guardado en /uploads
      url: { type: String, default: null },            // ruta pública para descargar/ver
      tipo: { type: String, default: null },            // mimetype, ej: application/pdf
      tamano: { type: Number, default: null },          // bytes
      fechaSubida: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

module.exports = tareaSchema;