const { query } = require('../../core/db');
const { trackMetric } = require('../../process/metrics/metricsExporter');

/**
 * Retorna las tareas del usuario autenticado (USER, BUSINESS, ADMIN).
 */
async function getTasks(req, res) {
  try {
    trackMetric('view_tasks');
    const userId = req.user.id;
    // Filtrar tareas asignadas al usuario actual
    const result = await query('SELECT * FROM tasks WHERE assigned_to = $1', [userId]);
    res.json({
      success: true,
      tasks: result.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Actualiza el estado de una tarea asignada.
 */
async function updateTaskStatus(req, res) {
  const { taskId, completed } = req.body;
  if (taskId === undefined || completed === undefined) {
    return res.status(400).json({ success: false, message: 'Parámetros taskId y completed son requeridos.' });
  }

  try {
    trackMetric('update_task');
    // En el fallback en memoria o PostgreSQL, actualiza la tarea
    const result = await query('UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *', [completed, taskId]);
    res.json({
      success: true,
      message: 'Estado de tarea actualizado correctamente.',
      task: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getTasks,
  updateTaskStatus
};
