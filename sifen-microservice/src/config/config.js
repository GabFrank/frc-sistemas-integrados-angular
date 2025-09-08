require('dotenv').config();

module.exports = {
    // Configuración del servidor
    port: process.env.PORT || 3001,
    
    // Configuración de SIFEN
    sifen: {
        baseUrl: process.env.SIFEN_BASE_URL || 'https://sifen-test.set.gov.py',
        timeout: parseInt(process.env.SIFEN_TIMEOUT_MS) || 30000, // 30 segundos
        maxRetries: parseInt(process.env.SIFEN_MAX_RETRIES) || 3,
        retryDelay: parseInt(process.env.SIFEN_RETRY_DELAY_MS) || 2000, // 2 segundos
        backoffMultiplier: parseFloat(process.env.SIFEN_BACKOFF_MULTIPLIER) || 1.5,
        connectionTimeout: parseInt(process.env.SIFEN_CONNECTION_TIMEOUT_MS) || 10000, // 10 segundos
        readTimeout: parseInt(process.env.SIFEN_READ_TIMEOUT_MS) || 25000, // 25 segundos
    },
    
    // Configuración de certificados
    certificates: {
        path: process.env.CERTIFICATE_PATH || './certificates/franco-arevalos-sa.pfx',
        password: process.env.CERTIFICATE_PASSWORD,
        keyFile: process.env.KEY_FILE || 'private.key',
        certFile: process.env.CERT_FILE || 'certificate.crt',
        caFile: process.env.CA_FILE || 'ca.crt'
    },

    // Configuración del CSC (Código de Seguridad)
    csc: {
        code: process.env.CSC_CODE || '',
        pin: process.env.CSC_PIN || ''
    },
    
    // Configuración de logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/sifen-microservice.log',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: process.env.LOG_MAX_FILES || 5
    },
    
    // Configuración de rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // máximo 100 requests por ventana
    },
    
    // Configuración de health check
    healthCheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS) || 30000, // 30 segundos
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS) || 5000 // 5 segundos
    },

    // Configuración del backend Java
    backend: require('./backend')
};