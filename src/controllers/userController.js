const User = require('../models/user');


// Un usuario solo puede consultar su propio perfil

const getUserById = async (req, res) => {
  try {
    if (req.usuario.id !== req.params.id) {
      return res.status(403).json({ mensaje: 'No puedes ver los datos de otro usuario' });
    }

    const usuario = await User.findById(req.params.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};


// Un usuario solo puede editar su propio perfil

const updateUser = async (req, res) => {
  try {
    if (req.usuario.id !== req.params.id) {
      return res.status(403).json({ mensaje: 'No puedes editar a otro usuario' });
    }

    const { username, email, password, ci } = req.body;

    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (username !== undefined) usuario.username = username;
    if (email !== undefined) usuario.email = email;
    if (password !== undefined) usuario.password = password; // el pre('save') del modelo lo hashea
    if (ci !== undefined) usuario.ci = ci;

    const usuarioActualizado = await usuario.save();
    const { password: _, ...usuarioSinPassword } = usuarioActualizado.toObject();

    res.status(200).json(usuarioSinPassword);
  } catch (error) {
    if (error.code === 11000) {
      const campo = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ mensaje: 'El ' + campo + ' ya está en uso' });
    }
    res.status(400).json({ mensaje: error.message });
  }
};


// Un usuario solo puede eliminar su propia cuenta

const deleteUser = async (req, res) => {
  try {
    if (req.usuario.id !== req.params.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar a otro usuario' });
    }

    const usuarioEliminado = await User.findByIdAndDelete(req.params.id);
    if (!usuarioEliminado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.status(200).json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// ---------------------------------------------
// GET /api/users/buscar?q=texto
// Busca estudiantes por nombre (username) o cédula (ci).
// Solo accesible para Docentes (se restringe en la ruta).
// Devuelve máximo 20 resultados, sin password.
// ---------------------------------------------
const buscarEstudiantes = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ mensaje: 'Escribe al menos 2 caracteres para buscar' });
    }

    const texto = q.trim();
    const textoEscapado = texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(textoEscapado, 'i');

    const estudiantes = await User.find({
      'rol.nombre': 'Estudiante',
      $or: [{ username: regex }, { ci: regex }],
    })
      .select('username email ci')
      .limit(20);

    res.status(200).json(estudiantes);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  getUserById,
  updateUser,
  deleteUser,
  buscarEstudiantes,
};
