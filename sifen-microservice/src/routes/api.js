const express = require('express');
const router = express.Router();
const dteGenerator = require('../services/dteGenerator');
const xmlSigner = require('../services/xmlSigner');
const SifenClient = require('../services/sifenClient');
const sifenClient = new SifenClient();
const logger = require('../utils/logger');
const axios = require('axios'); // Added axios for backend communication
const config = require('../config/config');

// Función mock para obtener datos de factura (temporal)
function obtenerDatosFactura(facturaId) {
  return {
    id: facturaId,
    numero: facturaId.toString().padStart(6, '0'), // Solo números, sin 'FAC-'
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

/**
 * Obtiene datos reales de la factura desde el backend Java
 */
async function obtenerDatosFacturaReal(facturaId, sucursalId) {
  try {
    logger.info('Consultando datos reales de factura en backend Java', { facturaId, sucursalId });
    
    // URL del backend Java
    const backendUrl = config.backend.url;
    const url = `${backendUrl}/api/sifen/factura/${facturaId}/sucursal/${sucursalId}`;
    
    logger.info('Consultando URL del backend', { url });
    
    // Realizar consulta HTTP al backend Java
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data) {
      logger.info('Datos de factura obtenidos exitosamente del backend', { 
        facturaId, 
        emisor: response.data.emisor?.ruc,
        receptor: response.data.receptor?.ruc,
        items: response.data.items?.length || 0
      });
      
      // Transformar datos del backend al formato esperado por el generador
      return transformarDatosFactura(response.data, facturaId);
    } else {
      logger.error('Respuesta inesperada del backend', { 
        status: response.status, 
        data: response.data 
      });
      return null;
    }
    
  } catch (error) {
    logger.error('Error consultando backend Java', { 
      facturaId, 
      sucursalId, 
      error: error.message 
    });
    
    // Fallback a datos mock si hay error de comunicación
    logger.warn('Usando datos mock como fallback');
    return obtenerDatosFactura(facturaId);
  }
}

/**
 * Transforma los datos del backend al formato esperado por el generador
 */
function transformarDatosFactura(datosBackend, facturaId) {
  return {
    id: facturaId,
    emisor: {
      ruc: datosBackend.emisor?.ruc || '80012345',
      razonSocial: datosBackend.emisor?.razonSocial || 'Empresa Demo',
      nombreComercial: datosBackend.emisor?.nombreComercial || 'Empresa Demo',
      direccion: datosBackend.emisor?.direccion || 'Dirección Demo',
      telefono: datosBackend.emisor?.telefono || '021-123456',
      email: datosBackend.emisor?.email || 'info@demo.com.py'
    },
    receptor: {
      ruc: datosBackend.receptor?.ruc || '12345678',
      razonSocial: datosBackend.receptor?.razonSocial || 'Cliente Demo',
      direccion: datosBackend.receptor?.direccion || 'Dirección Cliente',
      telefono: datosBackend.receptor?.telefono || '',
      email: datosBackend.receptor?.email || ''
    },
    documento: {
      tipo: datosBackend.documento?.tipo || 1,
      numero: datosBackend.documento?.numero || facturaId.toString().padStart(6, '0'),
      fecha: datosBackend.documento?.fecha || new Date().toISOString(),
      moneda: datosBackend.documento?.moneda || 'PYG',
      tipoCambio: datosBackend.documento?.tipoCambio || 1,
      condicionOperacion: datosBackend.documento?.condicionOperacion || 1,
      plazo: datosBackend.documento?.plazo || 0,
      numeroTimbrado: datosBackend.documento?.numeroTimbrado || '12345678901234567890',
      puntoExpedicion: datosBackend.documento?.puntoExpedicion || '001',
      serie: datosBackend.documento?.serie || '001'
    },
    items: datosBackend.items?.map(item => ({
      codigo: item.codigo || 'PROD' + item.id,
      descripcion: item.descripcion || 'Producto Demo',
      cantidad: item.cantidad || 1,
      precioUnitario: item.precioUnitario || 1000,
      descuento: item.descuento || 0,
      iva: item.iva || 100,
      total: item.total || 1100
    })) || [],
    totales: {
      gravada10: datosBackend.totales?.gravada10 || 1000,
      gravada5: datosBackend.totales?.gravada5 || 0,
      exenta: datosBackend.totales?.exenta || 0,
      iva10: datosBackend.totales?.iva10 || 100,
      iva5: datosBackend.totales?.iva5 || 0,
      total: datosBackend.totales?.total || 1100
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
    
    const { facturaId, sucursalId } = req.body;
    if (!facturaId || !sucursalId) {
      return res.status(400).json({ error: 'facturaId y sucursalId son requeridos' });
    }

    // Obtener datos reales de la factura desde el backend Java
    const datosFactura = await obtenerDatosFacturaReal(facturaId, sucursalId);
    if (!datosFactura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
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
    logger.info('Solicitud de envío de lote recibida', { 
      body: req.body,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length')
    });
    
    const { dtes } = req.body;
    
    // Validación detallada del array dtes
    if (!dtes) {
      logger.error('Campo dtes no encontrado en el body', { body: req.body });
      return res.status(400).json({ 
        error: 'Campo dtes es requerido',
        bodyRecibido: req.body 
      });
    }
    
    if (!Array.isArray(dtes)) {
      logger.error('Campo dtes no es un array', { dtes, tipo: typeof dtes });
      return res.status(400).json({ 
        error: 'dtes debe ser un array',
        tipoRecibido: typeof dtes,
        valorRecibido: dtes
      });
    }
    
    if (dtes.length === 0) {
      logger.error('Array dtes está vacío');
      return res.status(400).json({ 
        error: 'Array dtes no puede estar vacío',
        cantidadDtes: dtes.length
      });
    }

    logger.info('Validando estructura de cada DTE en el lote', { 
      cantidadDtes: dtes.length,
      primerDte: dtes[0] 
    });

    // Validar que cada DTE tenga XML y CDC
    for (let i = 0; i < dtes.length; i++) {
      const dte = dtes[i];
      logger.info(`Validando DTE ${i + 1}/${dtes.length}`, { 
        dteIndex: i,
        dte: dte,
        tieneXml: !!dte.xml,
        tieneCdc: !!dte.cdc,
        xmlLength: dte.xml ? dte.xml.length : 0,
        cdcLength: dte.cdc ? dte.cdc.length : 0
      });
      
      if (!dte.xml) {
        logger.error(`DTE ${i + 1} inválido: falta XML`, { dte, index: i });
        return res.status(400).json({ 
          error: `DTE ${i + 1} inválido: falta XML`,
          dteInvalido: dte,
          index: i
        });
      }
      
      if (!dte.cdc) {
        logger.error(`DTE ${i + 1} inválido: falta CDC`, { dte, index: i });
        return res.status(400).json({ 
          error: `DTE ${i + 1} inválido: falta CDC`,
          dteInvalido: dte,
          index: i
        });
      }
      
      // Validar que el CDC tenga exactamente 44 dígitos numéricos
      if (!/^\d{44}$/.test(dte.cdc)) {
        logger.error(`DTE ${i + 1} inválido: CDC debe tener 44 dígitos numéricos`, { 
          cdc: dte.cdc, 
          longitud: dte.cdc.length,
          esNumerico: /^\d+$/.test(dte.cdc)
        });
        return res.status(400).json({ 
          error: `DTE ${i + 1} inválido: CDC debe tener exactamente 44 dígitos numéricos`,
          cdcRecibido: dte.cdc,
          longitudRecibida: dte.cdc.length,
          dteInvalido: dte,
          index: i
        });
      }
    }

    logger.info('Todos los DTEs del lote son válidos', { 
      cantidadDtes: dtes.length,
      cdcs: dtes.map(d => d.cdc)
    });

    // ENVIAR A SIFEN TEST: Usar APIs reales de SIFEN en modo TEST
    try {
      // Enviar lote real a SIFEN TEST
      const resultado = await sifenClient.enviarLote(dtes);
      
      logger.info('Lote enviado exitosamente a SIFEN TEST', { 
        idProtocolo: resultado.idProtocolo,
        cantidadDtes: dtes.length,
        cdcs: dtes.map(d => d.cdc)
      });
      
      res.json(resultado);
    } catch (error) {
      logger.error('Error enviando lote a SIFEN TEST', { 
        error: error.message, 
        stack: error.stack,
        dtes: dtes.map(d => ({ cdc: d.cdc, xmlLength: d.xml ? d.xml.length : 0 }))
      });
      
      res.status(500).json({ 
        error: 'Error enviando lote a SIFEN TEST', 
        message: error.message,
        detalles: 'Verificar configuración de SIFEN y credenciales'
      });
    }
    
  } catch (error) {
    logger.error('Error enviando lote', { 
      error: error.message, 
      stack: error.stack,
      body: req.body 
    });
    res.status(500).json({ 
      error: 'Error enviando lote', 
      message: error.message,
      bodyRecibido: req.body
    });
  }
});

// Consultar estado de lote
router.get('/lote/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Consulta de lote solicitada', { loteId: id });
    
    // CONSULTAR EN SIFEN TEST: Usar APIs reales de SIFEN en modo TEST
    try {
      // Consultar estado real en SIFEN TEST
      const resultado = await sifenClient.consultarLote(id);
      
      logger.info('Consulta de lote completada en SIFEN TEST', { 
        loteId: id, 
        estado: resultado.estado,
        resultado: resultado
      });
      
      res.json(resultado);
    } catch (error) {
      logger.error('Error consultando lote en SIFEN TEST', { 
        error: error.message, 
        stack: error.stack,
        loteId: id
      });
      
      res.status(500).json({ 
        error: 'Error consultando lote en SIFEN TEST', 
        message: error.message,
        detalles: 'Verificar configuración de SIFEN y credenciales'
      });
    }
    
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

// Endpoint para consultar estado individual de un documento
router.get('/documento/:cdc/estado', async (req, res) => {
    try {
        const { cdc } = req.params;
        
        if (!cdc) {
            return res.status(400).json({
                success: false,
                error: 'CDC es requerido'
            });
        }
        
        logger.info(`Consultando estado individual del documento CDC: ${cdc}`);
        
        // Validar formato del CDC (44 dígitos)
        if (!/^\d{44}$/.test(cdc)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de CDC inválido. Debe tener 44 dígitos numéricos.'
            });
        }
        
        // Consultar estado en SIFEN
        const resultado = await sifenClient.consultarEstadoIndividual(cdc);
        
        logger.info(`Estado consultado para CDC ${cdc}: ${resultado.estado}`);
        
        res.json({
            success: true,
            cdc: cdc,
            estado: resultado.estado,
            mensaje: resultado.mensaje,
            timestamp: resultado.timestamp
        });
        
    } catch (error) {
        logger.error(`Error consultando estado individual del documento:`, error.message);
        res.status(500).json({
            success: false,
            error: `Error interno: ${error.message}`
        });
    }
});

module.exports = router;
