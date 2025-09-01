const express = require('express');
const router = express.Router();
const config = require('../config/config');
const logger = require('../utils/logger');
const path = require('path'); // Added missing import for path

// Health check básico
router.get('/', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'SIFEN Microservice',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Health check detallado
router.get('/detailed', async (req, res) => {
    try {
        const healthStatus = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'SIFEN Microservice',
            version: '1.0.0',
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            },
            config: {
                sifenBaseUrl: config.sifen.baseUrl,
                timeout: config.sifen.timeout,
                maxRetries: config.sifen.maxRetries,
                logLevel: config.logging.level
            },
            checks: {
                database: 'N/A', // No hay base de datos en este microservicio
                sifenConnection: 'PENDING', // Se verifica en el siguiente endpoint
                certificates: 'PENDING'
            }
        };

        // Verificar certificados
        try {
            const fs = require('fs');
            const certPath = config.certificates.path;
            const keyFile = path.join(certPath, config.certificates.keyFile);
            const certFile = path.join(certPath, config.certificates.certFile);
            
            if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
                healthStatus.checks.certificates = 'OK';
            } else {
                healthStatus.checks.certificates = 'ERROR';
                healthStatus.status = 'DEGRADED';
            }
        } catch (error) {
            healthStatus.checks.certificates = 'ERROR';
            healthStatus.status = 'DEGRADED';
        }

        res.json(healthStatus);
        
    } catch (error) {
        logger.error('Error en health check detallado:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Health check de conectividad con SIFEN
router.get('/sifen', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Intentar conectar a SIFEN (solo verificar conectividad)
        const axios = require('axios');
        const response = await axios.get(config.sifen.baseUrl, {
            timeout: 5000, // Timeout corto para health check
            validateStatus: () => true // Aceptar cualquier status
        });
        
        const responseTime = Date.now() - startTime;
        
        const sifenStatus = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            sifenUrl: config.sifen.baseUrl,
            responseTime: `${responseTime}ms`,
            httpStatus: response.status,
            connected: responseTime < 10000 // Considerar conectado si responde en menos de 10s
        };
        
        if (sifenStatus.connected) {
            res.json(sifenStatus);
        } else {
            sifenStatus.status = 'SLOW';
            res.status(200).json(sifenStatus);
        }
        
    } catch (error) {
        logger.error('Error en health check de SIFEN:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            sifenUrl: config.sifen.baseUrl,
            error: error.message,
            connected: false
        });
    }
});

// Health check de métricas del sistema
router.get('/metrics', (req, res) => {
    try {
        const metrics = {
            timestamp: new Date().toISOString(),
            process: {
                pid: process.pid,
                platform: process.platform,
                nodeVersion: process.version,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            },
            system: {
                arch: process.arch,
                cwd: process.cwd(),
                env: process.env.NODE_ENV
            }
        };
        
        res.json(metrics);
        
    } catch (error) {
        logger.error('Error obteniendo métricas:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
