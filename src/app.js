const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const rolRoute = require('./routes/rolRoute');
const materiaRoute = require('./routes/materiaRoute');
const tareaRoute = require('./routes/tareaRoute');
const userRoute = require('./routes/userRoute');
const authRoute = require('./routes/authRoute');

app.use(express.json());
app.use(cors());

// Sirve los archivos subidos (PDF/Word) para que se puedan ver/descargar por URL directa.
// Ej: http://localhost:5000/uploads/1699999999-123456789.pdf
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/roles', rolRoute);
app.use('/api/materias', materiaRoute);
app.use('/api/tareas', tareaRoute);
app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);

// ---------------------------------------------
// Manejador de errores global.
// Sin esto, un error de multer (tipo de archivo inválido, archivo
// demasiado grande, etc.) se iba directo al manejador por defecto de
// Express, que responde HTML en vez de JSON — el frontend no podía
// leer el mensaje real y solo mostraba "Error al subir el archivo".
// ---------------------------------------------
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ mensaje: 'El archivo supera el máximo de 10 MB' });
    }
    return res.status(400).json({ mensaje: err.message });
  }

  if (err) {
    // Errores lanzados a mano dentro del fileFilter de multer (tipo no permitido)
    return res.status(400).json({ mensaje: err.message || 'Error al procesar el archivo' });
  }

  next();
});

module.exports = app;
