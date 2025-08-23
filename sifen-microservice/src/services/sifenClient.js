const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class SifenClient {
  constructor() {
    this.baseUrl = config.sifen.baseUrl;
    this.timeout = config.sifen.timeout;
    this.maxRetries = config.sifen.maxRetries;
    this.retryDelay = config.sifen.retryDelay;
    
    // Configurar axios con interceptores
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
        'User-Agent': 'FrancoSystems-SIFEN-Client/1.0'
      }
    });

    this.configurarInterceptores();
  }

  /**
   * Configura interceptores para logging y reintentos
   */
  configurarInterceptores() {
    // Interceptor de request
    this.httpClient.interceptors.request.use(
      (config) => {
        logger.info('Enviando request a SIFEN', {
          method: config.method,
          url: config.url,
          data: config.data ? 'XML presente' : 'Sin datos'
        });
        return config;
      },
      (error) => {
        logger.error('Error en request a SIFEN', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Interceptor de response
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.info('Respuesta recibida de SIFEN', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('Error en respuesta de SIFEN', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Envía un lote de DTEs a SIFEN
   */
  async enviarLote(loteXmls) {
    try {
      logger.info('Enviando lote a SIFEN', { cantidad: loteXmls.length });

      const loteData = this.prepararLote(loteXmls);
      
      const response = await this.httpClient.post('/ws/recepcionLote', loteData, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });

      if (response.status === 200) {
        const resultado = this.procesarRespuestaEnvio(response.data);
        logger.info('Lote enviado exitosamente', { 
          protocoloId: resultado.protocoloId 
        });
        return resultado;
      } else {
        throw new Error(`Error enviando lote: ${response.status}`);
      }

    } catch (error) {
      logger.error('Error enviando lote a SIFEN', { error: error.message });
      throw error;
    }
  }

  /**
   * Consulta el estado de un lote enviado
   */
  async consultarLote(protocoloId) {
    try {
      logger.info('Consultando estado de lote', { protocoloId });

      const response = await this.httpClient.get(`/ws/consultaLote/${protocoloId}`, {
        headers: {
          'Accept': 'application/xml'
        }
      });

      if (response.status === 200) {
        const resultado = this.procesarRespuestaConsulta(response.data);
        logger.info('Consulta de lote exitosa', { 
          protocoloId,
          estado: resultado.estado 
        });
        return resultado;
      } else {
        throw new Error(`Error consultando lote: ${response.status}`);
      }

    } catch (error) {
      logger.error('Error consultando lote en SIFEN', { 
        protocoloId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Registra un evento DTE (cancelación, conformidad, etc.)
   */
  async registrarEvento(cdc, tipoEvento, motivo, observacion) {
    try {
      logger.info('Registrando evento DTE', { 
        cdc, 
        tipoEvento, 
        motivo 
      });

      const eventoData = this.prepararEvento(cdc, tipoEvento, motivo, observacion);
      
      const response = await this.httpClient.post('/ws/evento', eventoData, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });

      if (response.status === 200) {
        const resultado = this.procesarRespuestaEvento(response.data);
        logger.info('Evento registrado exitosamente', { 
          cdc, 
          tipoEvento,
          protocoloId: resultado.protocoloId 
        });
        return resultado;
      } else {
        throw new Error(`Error registrando evento: ${response.status}`);
      }

    } catch (error) {
      logger.error('Error registrando evento en SIFEN', { 
        cdc, 
        tipoEvento, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Prepara el XML del lote para envío
   */
  prepararLote(xmls) {
    const loteXml = `<?xml version="1.0" encoding="UTF-8"?>
<rLote version="1.0">
  <dId>${this.generarIdLote()}</dId>
  <dFecLote>${this.formatearFecha(new Date())}</dFecLote>
  <dCantDoc>${xmls.length}</dCantDoc>
  <dTotMonto>${this.calcularTotalLote(xmls)}</dTotMonto>
  <gTimb>
    <dVerif>${this.generarDigestLote(xmls)}</dVerif>
  </gTimb>
  <dTE>
    ${xmls.map(xml => `<dTEItem>${xml}</dTEItem>`).join('\n    ')}
  </dTE>
</rLote>`;

    return loteXml;
  }

  /**
   * Prepara el XML del evento para envío
   */
  prepararEvento(cdc, tipoEvento, motivo, observacion) {
    const eventoXml = `<?xml version="1.0" encoding="UTF-8"?>
<rEvento version="1.0">
  <dId>${this.generarIdEvento()}</dId>
  <dFecEvento>${this.formatearFecha(new Date())}</dFecEvento>
  <dTipoEvento>${tipoEvento}</dTipoEvento>
  <dCDC>${cdc}</dCDC>
  <dMotivo>${motivo}</dMotivo>
  <dObservacion>${observacion || ''}</dObservacion>
</rEvento>`;

    return eventoXml;
  }

  /**
   * Procesa la respuesta del envío de lote
   */
  procesarRespuestaEnvio(xmlRespuesta) {
    // Aquí deberías parsear el XML de respuesta de SIFEN
    // Por ahora retornamos un mock
    return {
      protocoloId: this.generarProtocoloId(),
      estado: 'RECIBIDO',
      mensaje: 'Lote recibido correctamente',
      fechaRecepcion: new Date().toISOString()
    };
  }

  /**
   * Procesa la respuesta de consulta de lote
   */
  procesarRespuestaConsulta(xmlRespuesta) {
    // Aquí deberías parsear el XML de respuesta de SIFEN
    // Por ahora retornamos un mock
    return {
      protocoloId: 'PROTOCOLO-123',
      estado: 'PROCESADO',
      mensaje: 'Lote procesado correctamente',
      fechaProcesamiento: new Date().toISOString(),
      resultados: [
        { cdc: 'CDC123', estado: 'APROBADO', mensaje: 'Documento aprobado' },
        { cdc: 'CDC456', estado: 'RECHAZADO', mensaje: 'Error en validación' }
      ]
    };
  }

  /**
   * Procesa la respuesta del registro de evento
   */
  procesarRespuestaEvento(xmlRespuesta) {
    // Aquí deberías parsear el XML de respuesta de SIFEN
    // Por ahora retornamos un mock
    return {
      protocoloId: this.generarProtocoloId(),
      estado: 'REGISTRADO',
      mensaje: 'Evento registrado correctamente',
      fechaRegistro: new Date().toISOString()
    };
  }

  /**
   * Utilidades
   */
  generarIdLote() {
    return `LOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generarIdEvento() {
    return `EVENTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generarProtocoloId() {
    return `PROTOCOLO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  formatearFecha(fecha) {
    return fecha.toISOString().replace(/[-:]/g, '').substring(0, 14);
  }

  calcularTotalLote(xmls) {
    // Aquí deberías extraer y sumar los totales de cada XML
    // Por ahora retornamos un valor mock
    return xmls.length * 100000;
  }

  generarDigestLote(xmls) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    xmls.forEach(xml => hash.update(xml));
    return hash.digest('base64');
  }

  /**
   * Método para reintentos automáticos
   */
  async ejecutarConReintentos(operacion, ...args) {
    let ultimoError;
    
    for (let intento = 1; intento <= this.maxRetries; intento++) {
      try {
        return await operacion.apply(this, args);
      } catch (error) {
        ultimoError = error;
        logger.warn(`Intento ${intento} falló`, { 
          error: error.message,
          reintentosRestantes: this.maxRetries - intento 
        });
        
        if (intento < this.maxRetries) {
          await this.esperar(this.retryDelay * intento);
        }
      }
    }
    
    throw new Error(`Operación falló después de ${this.maxRetries} intentos: ${ultimoError.message}`);
  }

  esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new SifenClient();
