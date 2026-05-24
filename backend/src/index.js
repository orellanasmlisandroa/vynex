const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const apiRouter = require('./module/routes');
const { logger, trackMetric, exportMetricsToDocs } = require('./process/metrics/metricsExporter');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de middlewares globales
app.use(cors());
app.use(express.json());

// Registro de logs de peticiones
app.use((req, res, next) => {
  trackMetric('request');
  logger.info(`[REST] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Enrutar todas las llamadas de la API
app.use('/api/v1', apiRouter);

// Ruta de estado base (Liveness check)
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'VYNEX',
    timestamp: new Date()
  });
});

// Creación del servidor HTTP unificado
const server = http.createServer(app);

// Inicialización de servidor WebSockets en el mismo servidor HTTP
const wss = new WebSocket.Server({ noServer: true });

// Controlar conexiones WebSocket
wss.on('connection', (ws) => {
  trackMetric('connect');
  logger.info('[WebSocket] Nuevo cliente conectado al bus de eventos de VYNEX.');

  // Enviar mensaje de bienvenida con el estado inicial
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Conectado al bus de eventos de VYNEX.',
    timestamp: new Date()
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      logger.info(`[WebSocket] Mensaje recibido de cliente: ${JSON.stringify(parsed)}`);
      
      // Responder con eco o procesar evento
      ws.send(JSON.stringify({
        type: 'response',
        originalType: parsed.type,
        status: 'RECEIVED'
      }));
    } catch (err) {
      logger.error(`Error al procesar mensaje WebSocket: ${err.message}`);
    }
  });

  ws.on('close', () => {
    trackMetric('disconnect');
    logger.info('[WebSocket] Cliente desconectado.');
  });
});

// Integrar el WebSocket con el servidor HTTP
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  logger.info(`🚀 Servidor VYNEX corriendo en http://localhost:${PORT}`);
  logger.info(`🔌 WebSocket disponible en ws://localhost:${PORT}`);
  
  // Realizar exportación de métricas iniciales de inmediato
  exportMetricsToDocs();
});

module.exports = {
  app,
  server,
  wss
};
