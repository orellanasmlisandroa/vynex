const { query, inMemoryDB } = require('../../core/db');
const { logger } = require('../../process/metrics/metricsExporter');

/**
 * Retorna todos los usuarios registrados (ADMIN ONLY).
 */
async function listUsers(req, res) {
  try {
    logger.info(`[AdminController] Listado de usuarios solicitado por: ${req.user.username}`);
    const result = await query('SELECT id, username, email, role FROM users');
    res.json({
      success: true,
      users: result.rows
    });
  } catch (err) {
    logger.error(`Error en listUsers: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Modifica el rol de un usuario específico (ADMIN ONLY).
 */
async function updateUserRole(req, res) {
  const { userId, newRole } = req.body;
  if (!userId || !newRole) {
    return res.status(400).json({ success: false, message: 'Parámetros userId y newRole son requeridos.' });
  }

  try {
    logger.info(`[AdminController] Cambio de rol solicitado para el usuario ID: ${userId} a: ${newRole} por: ${req.user.username}`);
    
    // Si estamos usando el mock en memoria
    const user = inMemoryDB.users.find(u => u.id === parseInt(userId));
    if (user) {
      user.role = newRole;
      return res.json({
        success: true,
        message: `Rol del usuario ${user.username} modificado correctamente a ${newRole}.`,
        user: { id: user.id, username: user.username, role: user.role }
      });
    }

    // Si fuera base de datos real
    await query('UPDATE users SET role = $1 WHERE id = $2', [newRole, userId]);
    res.json({
      success: true,
      message: `Rol del usuario ID ${userId} actualizado a ${newRole} en PostgreSQL.`
    });
  } catch (err) {
    logger.error(`Error en updateUserRole: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listUsers,
  updateUserRole
};
