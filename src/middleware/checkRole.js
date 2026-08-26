// Restringe una ruta a ciertos roles.
// Uso: router.post('/', checkRole(['Docente']), createMateria);
const checkRole = (allowedRoles) => (req, res, next) => {
  if (!req.usuario || !allowedRoles.includes(req.usuario.rolNombre)) {
    return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
  }
  next();
};

module.exports = checkRole;