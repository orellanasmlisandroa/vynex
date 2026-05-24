const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// Carpeta de exportación requerida: /docs/logs_metrics
const EXPORT_DIR = path.join(__dirname, '../../../../docs/logs_metrics');

// Crear la carpeta de logs si no existe
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// Configuración del Logger de Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(EXPORT_DIR, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(EXPORT_DIR, 'combined.log') 
    })
  ]
});

// Variables en memoria para agregar métricas del servidor
const metricsRegistry = {
  totalRequests: 0,
  activeConnections: 0,
  completedFlows: 0,
  failedFlows: 0,
  lastExported: null
};

/**
 * Registra una métrica en el registro interno e inicia la exportación al sistema de archivos.
 * @param {string} type - Tipo de evento de métrica
 */
function trackMetric(type) {
  metricsRegistry.totalRequests += 1;
  if (type === 'flow_complete') metricsRegistry.completedFlows += 1;
  if (type === 'flow_failed') metricsRegistry.failedFlows += 1;
  if (type === 'connect') metricsRegistry.activeConnections += 1;
  if (type === 'disconnect') metricsRegistry.activeConnections = Math.max(0, metricsRegistry.activeConnections - 1);
  
  // Realizar exportación inmediata si hay cambios críticos
  exportMetricsToDocs();
}

/**
 * Vuelca las métricas acumuladas del servidor a un archivo JSON en /docs/logs_metrics/metrics.json
 */
function exportMetricsToDocs() {
  metricsRegistry.lastExported = new Date().toISOString();
  
  const systemStats = {
    metrics: metricsRegistry,
    system: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform
    }
  };

  try {
    const metricsFilePath = path.join(EXPORT_DIR, 'metrics.json');
    fs.writeFileSync(metricsFilePath, JSON.stringify(systemStats, null, 2), 'utf8');
    logger.info(`[MetricsExporter] Métricas exportadas correctamente a: docs/logs_metrics/metrics.json`);
  } catch (err) {
    logger.error(`❌ Error al escribir las métricas del sistema en /docs: ${err.message}`);
  }
}

// Iniciar un temporizador para volcar métricas en segundo plano automáticamente cada 60 segundos
setInterval(exportMetricsToDocs, 60000);

module.exports = {
  logger,
  trackMetric,
  exportMetricsToDocs,
  metricsRegistry
};
