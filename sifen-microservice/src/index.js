const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const config = require('./config/config');
const logger = require('./utils/logger');
const apiRoutes = require('./routes/api'); // Descomentado

const app = express();

// Middleware de seguridad
app.use(helmet());

// Middleware de CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Middleware de compresión
app.use(compression());

// Middleware de logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Middleware para parsear JSON y XML
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas de la API - Descomentado
app.use('/api', apiRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    service: 'SIFEN Microservice',
    version: '1.0.0',
    description: 'Microservicio para generación y envío de DTEs a SIFEN Paraguay',
    status: 'Servidor funcionando - API habilitada',
    endpoints: {
      health: '/api/health',
      generar: '/api/documento/generar',
      enviarLote: '/api/lote/enviar',
      consultarLote: '/api/lote/:id',
      registrarEvento: '/api/evento/registrar'
    }
  });
});

// Ruta de salud simple
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'SIFEN Microservice - Servidor funcionando'
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    error: 'Error interno del servidor',
    message: config.server.nodeEnv === 'development' ? err.message : 'Error interno'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Iniciar servidor
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`Servidor SIFEN iniciado en puerto ${PORT}`, {
    port: PORT,
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString()
  });
  console.log(`🚀 Servidor SIFEN iniciado en puerto ${PORT}`);
  console.log(`📋 Estado: Servidor funcionando - API habilitada`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('Señal SIGTERM recibida, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Señal SIGINT recibida, cerrando servidor...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  logger.error('Excepción no capturada', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada', { reason, promise });
  process.exit(1);
});

module.exports = app;
