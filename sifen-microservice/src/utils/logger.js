const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// Crear directorio de logs si no existe
const fs = require('fs');
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Configurar formato personalizado
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        return log;
    })
);

// Configurar transportes
const transports = [
    // Consola con colores
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    })
];

// Agregar archivo de log si está configurado
if (config.logging.file) {
    transports.push(
        new winston.transports.File({
            filename: config.logging.file,
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles,
            format: logFormat
        })
    );
}

// Crear logger
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    transports: transports,
    exitOnError: false
});

// Agregar método para logging de performance
logger.performance = (operation, duration, metadata = {}) => {
    logger.info(`Performance: ${operation}`, {
        duration: `${duration}ms`,
        ...metadata
    });
};

// Agregar método para logging de SIFEN específico
logger.sifen = (message, metadata = {}) => {
    logger.info(`[SIFEN] ${message}`, metadata);
};

// Agregar método para logging de errores de SIFEN
logger.sifenError = (message, error, metadata = {}) => {
    logger.error(`[SIFEN ERROR] ${message}`, {
        error: error.message,
        stack: error.stack,
        ...metadata
    });
};

module.exports = logger;
