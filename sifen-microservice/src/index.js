const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const logger = require('./utils/logger');

// Importar rutas
const apiRoutes = require('./routes/api');
const healthRoutes = require('./routes/health');

// Crear aplicación Express
const app = express();

// Configurar rate limiting optimizado
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requests por ventana (incrementado por optimización del backend)
  message: 'Demasiadas requests desde esta IP, intenta más tarde.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware de seguridad y rendimiento
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Rutas de health check (sin rate limiting)
app.use('/health', healthRoutes);

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'SIFEN Microservice API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      generate: '/api/documento/generar',
      send: '/api/lote/enviar',
      consult: '/api/lote/:id'
    }
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 SIFEN Microservice iniciado en puerto ${PORT}`);
  logger.info(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 SIFEN URL: ${config.sifen.baseUrl}`);
  logger.info(`📝 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔧 Configuración: Timeout=${config.sifen.timeout}ms, Retries=${config.sifen.maxRetries}`);
});
