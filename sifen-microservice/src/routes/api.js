const express = require('express');
const router = express.Router();
const dteGenerator = require('../services/dteGenerator');
const xmlSigner = require('../services/xmlSigner');
const sifenClient = require('../services/sifenClient');
const logger = require('../utils/logger');

// Función mock para obtener datos de factura (temporal)
function obtenerDatosFactura(facturaId) {
  return {
    id: facturaId,
    numero: `FAC-${facturaId.toString().padStart(6, '0')}`,
    fecha: new Date().toISOString(),
    tipoDocumento: 1, // 1=Factura
    moneda: 'PYG',
    tipoCambio: 1,
    condicionOperacion: 1, // 1=Contado
    plazo: 0,
    emisor: {
      ruc: '80012345',
      razonSocial: 'FRANCO AREVALOS S.A.',
      nombreComercial: 'FRANCO AREVALOS S.A.',
      direccion: 'Av. Principal 123, Asunción',
      telefono: '021-123456',
      email: 'info@francoarevalos.com.py'
    },
    receptor: {
      ruc: '12345678',
      razonSocial: 'Cliente de Prueba',
      direccion: 'Dirección de Prueba',
      telefono: '021-654321',
      email: 'cliente@demo.com.py'
    },
    items: [
      {
        codigo: 'PROD001',
        descripcion: 'Producto de Prueba',
        cantidad: 1,
        precioUnitario: 10000,
        descuento: 0,
        iva: 1000,
        total: 11000
      }
    ],
    totales: {
      gravada10: 10000,
      gravada5: 0,
      exenta: 0,
      iva10: 1000,
      iva5: 0,
      total: 11000
    }
  };
}

// Ruta de salud
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'SIFEN Microservice API'
  });
});

// Endpoint de prueba para comunicación con backend
router.get('/test-backend-communication', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Comunicación exitosa con el microservicio Node.js',
    timestamp: new Date().toISOString(),
    microservice: 'SIFEN Node.js',
    version: '1.0.0',
    endpoints: {
      generar: '/api/documento/generar',
      enviarLote: '/api/lote/enviar',
      consultarLote: '/api/lote/:id',
      registrarEvento: '/api/evento/registrar'
    }
  });
});

// Generar DTE desde factura legal
router.post('/documento/generar', async (req, res) => {
  try {
    logger.info('Solicitud de generación de DTE recibida', { body: req.body });
    
    const { facturaId } = req.body;
    if (!facturaId) {
      return res.status(400).json({ error: 'facturaId es requerido' });
    }

    // Obtener datos de la factura (mock por ahora)
    const datosFactura = obtenerDatosFactura(facturaId);
    
    // Generar DTE completo (incluye XML, CDC, QR)
    const dte = await dteGenerator.generarDte(datosFactura);
    
    const resultado = {
      success: true,
      dte: {
        id: dte.id || facturaId,
        cdc: dte.cdc,
        xml: dte.xmlFirmado,
        qrUrl: dte.qrUrl,
        estado: dte.estado,
        fechaGeneracion: new Date().toISOString()
      }
    };
    
    logger.info('DTE generado exitosamente', { cdc: dte.cdc, facturaId });
    res.json(resultado);
    
  } catch (error) {
    logger.error('Error generando DTE', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Error generando DTE', 
      message: error.message 
    });
  }
});

// Enviar lote de DTEs
router.post('/lote/enviar', async (req, res) => {
  try {
    logger.info('Solicitud de envío de lote recibida', { body: req.body });
    
    const { dtes } = req.body;
    if (!dtes || !Array.isArray(dtes)) {
      return res.status(400).json({ error: 'dtes debe ser un array' });
    }

    // Enviar lote a SIFEN
    const resultado = await sifenClient.enviarLote(dtes);
    
    logger.info('Lote enviado exitosamente', { 
      protocoloId: resultado.protocoloId,
      cantidadDtes: dtes.length 
    });
    
    res.json(resultado);
    
  } catch (error) {
    logger.error('Error enviando lote', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Error enviando lote', 
      message: error.message 
    });
  }
});

// Consultar estado de lote
router.get('/lote/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Consulta de lote solicitada', { loteId: id });
    
    // Consultar estado en SIFEN
    const resultado = await sifenClient.consultarLote(id);
    
    logger.info('Consulta de lote completada', { loteId: id, estado: resultado.estado });
    res.json(resultado);
    
  } catch (error) {
    logger.error('Error consultando lote', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Error consultando lote', 
      message: error.message 
    });
  }
});

// Registrar evento de DTE
router.post('/evento/registrar', async (req, res) => {
  try {
    logger.info('Solicitud de registro de evento recibida', { body: req.body });
    
    const { cdc, tipoEvento, motivo, observacion } = req.body;
    if (!cdc || !tipoEvento) {
      return res.status(400).json({ error: 'cdc y tipoEvento son requeridos' });
    }

    // Registrar evento en SIFEN
    const resultado = await sifenClient.registrarEvento(cdc, tipoEvento, motivo, observacion);
    
    logger.info('Evento registrado exitosamente', { 
      cdc, 
      tipoEvento, 
      protocoloId: resultado.protocoloId 
    });
    
    res.json(resultado);
    
  } catch (error) {
    logger.error('Error registrando evento', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Error registrando evento', 
      message: error.message 
    });
  }
});

module.exports = router;
