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

module.exports = app;