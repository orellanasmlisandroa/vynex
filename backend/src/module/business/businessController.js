const { query } = require('../../core/db');
const { dispatchFlow } = require('../../process/automations/stitch');
const { metricsRegistry, trackMetric } = require('../../process/metrics/metricsExporter');

/**
 * Retorna las métricas del sistema actualizadas en tiempo real (BUSINESS & ADMIN).
 */
async function getOperationalMetrics(req, res) {
  try {
    trackMetric('view_metrics');
    
    // Obtener recuento de flujos de la base de datos
    const flowsResult = await query('SELECT status, COUNT(*) as count FROM flows GROUP BY status');
    const tasksResult = await query('SELECT completed, COUNT(*) as count FROM tasks GROUP BY completed');

    res.json({
      success: true,
      metrics: {
        serverStats: metricsRegistry,
        dbSummary: {
          flows: flowsResult.rows,
          tasks: tasksResult.rows
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Dispara un flujo automatizado a Stitch (BUSINESS & ADMIN).
 */
async function triggerStitchFlow(req, res) {
  const { flowName, payload } = req.body;
  if (!flowName) {
    return res.status(400).json({ success: false, message: 'El parámetro flowName es obligatorio.' });
  }

  try {
    trackMetric('trigger_flow');
    const result = await dispatchFlow(flowName, req.user.role, payload);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getOperationalMetrics,
  triggerStitchFlow
};
