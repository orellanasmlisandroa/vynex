const { ROLES, PERMISSIONS } = require('../../../../shared/constants');

/**
 * Middleware dinámico para requerir un rol específico.
 * @param {string} requiredRole - El rol requerido ('ADMIN', 'BUSINESS', 'USER')
 */
function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error interno: req.user no inicializado. Asegúrese de montar verifyToken antes.' 
      });
    }

    const userRole = req.user.role;

    // Validación jerárquica de accesos
    if (userRole === ROLES.ADMIN) {
      // El administrador tiene control total y puede acceder a todo
      return next();
    }

    if (requiredRole === ROLES.BUSINESS && userRole === ROLES.BUSINESS) {
      return next();
    }

    if (requiredRole === ROLES.USER && (userRole === ROLES.USER || userRole === ROLES.BUSINESS)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Acceso restringido. Se requiere rol: ${requiredRole}. Tu rol actual es: ${userRole}`
    });
  };
}

/**
 * Middleware para validar permisos específicos.
 * @param {string} permission - El permiso requerido (ej. 'manage_users')
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error interno: req.user no inicializado.' 
      });
    }

    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole] || [];

    if (userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Acceso denegado. No cuentas con el permiso requerido: "${permission}"`
    });
  };
}

module.exports = {
  requireRole,
  requirePermission
};
