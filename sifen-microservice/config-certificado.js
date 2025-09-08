/**
 * CONFIGURACIÓN DE CERTIFICADO DIGITAL
 *
 * Copia este archivo como .env en la raíz del proyecto y configura tus valores
 */

module.exports = {
    // Configuración del certificado digital (.pfx)
    CERTIFICATE_PATH: './certificates/tu-certificado.pfx',
    CERTIFICATE_PASSWORD: 'tu_password_del_certificado',

    // Configuración del servidor
    PORT: 3001,

    // Configuración de SIFEN
    SIFEN_BASE_URL: 'https://sifen-test.set.gov.py',
    SIFEN_TIMEOUT_MS: 30000,
    SIFEN_MAX_RETRIES: 3,
    SIFEN_RETRY_DELAY_MS: 2000,
    SIFEN_BACKOFF_MULTIPLIER: 1.5,
    SIFEN_CONNECTION_TIMEOUT_MS: 10000,
    SIFEN_READ_TIMEOUT_MS: 25000,

    // Configuración de logging
    LOG_LEVEL: 'info',
    LOG_FILE: './logs/sifen-microservice.log',
    LOG_MAX_SIZE: '10m',
    LOG_MAX_FILES: 5,

    // Configuración de rate limiting
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,

    // Configuración de health check
    HEALTH_CHECK_ENABLED: true,
    HEALTH_CHECK_INTERVAL_MS: 30000,
    HEALTH_CHECK_TIMEOUT_MS: 5000
};

/*
INSTRUCCIONES PARA CONFIGURAR:

1. Copia este archivo como .env en la raíz del proyecto:
   cp config-certificado.js .env

2. Edita el archivo .env con tus valores reales:
   - CERTIFICATE_PATH: ruta completa a tu archivo .pfx
   - CERTIFICATE_PASSWORD: contraseña de tu certificado

3. Coloca tu archivo .pfx en la carpeta certificates/

4. Ejecuta el script de XML firmado:
   node xml-firmado-prevalidador.js

IMPORTANTE:
- El certificado debe estar vigente
- La contraseña debe ser correcta
- El archivo debe tener permisos de lectura
*/
