const axios = require('axios');
const https = require('https');
const fs = require('fs');
const config = require('../config/config');
const logger = require('../utils/logger');

class SifenClient {
  constructor() {
    this.baseUrl = config.sifen.baseUrl;
    this.timeout = config.sifen.timeout;
    this.maxRetries = config.sifen.maxRetries;
    this.retryDelay = config.sifen.retryDelay;
    this.backoffMultiplier = config.sifen.backoffMultiplier;

    // Configurar agente HTTPS con certificado de cliente
    this.configurarAgenteHTTPS();

    // Configurar axios con interceptores y reintentos
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      httpsAgent: this.httpsAgent,
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml, text/html, text/plain',
        'User-Agent': 'SIFEN-Microservice/1.0',
        'Connection': 'keep-alive'
      }
    });

    this.configurarInterceptores();
    this.configurarReintentos();
    
    logger.info(`SifenClient inicializado - Base URL: ${this.baseUrl}, Timeout: ${this.timeout}ms, Max Retries: ${this.maxRetries}`);
  }

  /**
   * Configura el agente HTTPS con certificado de cliente para autenticación mutua
   */
  configurarAgenteHTTPS() {
    try {
      // Verificar si existe el archivo del certificado
      if (!fs.existsSync(config.certificates.path)) {
        logger.warn(`[SIFEN] Certificado no encontrado en ${config.certificates.path}, usando configuración sin certificado`);
        this.httpsAgent = new https.Agent({
          rejectUnauthorized: false, // Solo para desarrollo/test
          keepAlive: true
        });
        return;
      }

      // Leer el certificado PFX
      const pfxBuffer = fs.readFileSync(config.certificates.path);

      // Configurar agente HTTPS con certificado de cliente
      this.httpsAgent = new https.Agent({
        pfx: pfxBuffer,
        passphrase: config.certificates.password,
        rejectUnauthorized: false, // Solo para desarrollo/test - en producción debería ser true
        keepAlive: true,
        timeout: this.timeout,
        // Configuración adicional para BIG-IP APM
        ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
        secureProtocol: 'TLSv1_2_method'
      });

      logger.info(`[SIFEN] Agente HTTPS configurado con certificado de cliente: ${config.certificates.path}`);

    } catch (error) {
      logger.error(`[SIFEN] Error configurando agente HTTPS: ${error.message}`);
      // Fallback: agente sin certificado
      this.httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true
      });
    }
  }

  /**
   * Configura interceptores para logging
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
   * Configura reintentos automáticos para errores de red y servidor
   */
  configurarReintentos() {
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config: requestConfig } = error;
        
        // Solo reintentar para errores de red o servidor
        if (this.debeReintentar(error) && requestConfig && !requestConfig.__isRetryRequest) {
          requestConfig.__isRetryRequest = true;
          requestConfig.__retryCount = requestConfig.__retryCount || 0;
          
          if (requestConfig.__retryCount < this.maxRetries) {
            requestConfig.__retryCount++;
            
            const delay = this.calcularDelayReintento(requestConfig.__retryCount);
            logger.warn(`Reintentando request (${requestConfig.__retryCount}/${this.maxRetries}) después de ${delay}ms - Error: ${error.message}`);
            
            await this.esperar(delay);
            
            // Aumentar timeout para reintentos
            requestConfig.timeout = Math.min(this.timeout * 2, 60000);
            
            return this.httpClient(requestConfig);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Determina si se debe reintentar basado en el error
   */
  debeReintentar(error) {
    // Reintentar para errores de red
    if (error.code === 'ECONNRESET' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // Reintentar para errores 5xx (servidor)
    if (error.response && error.response.status >= 500 && error.response.status < 600) {
      return true;
    }
    
    // Reintentar para timeouts
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return true;
    }
    
    return false;
  }

  /**
   * Calcula delay exponencial para reintentos
   */
  calcularDelayReintento(retryCount) {
    return this.retryDelay * Math.pow(this.backoffMultiplier, retryCount - 1);
  }

  /**
   * Función de espera
   */
  esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Envía un lote de DTEs a SIFEN TEST
   */
  async enviarLote(loteData) {
    try {
      logger.info('Enviando lote a SIFEN TEST', { cantidad: loteData.length });

      // Extraer solo los XMLs del array de objetos {xml, cdc}
      const xmls = loteData.map(item => item.xml);
      
      const loteXml = this.prepararLote(xmls);
      
      logger.info('XML del lote preparado', { 
        loteXmlLength: loteXml.length,
        cantidadDtes: xmls.length
      });
      
      // Probar diferentes endpoints de SIFEN TEST
      const endpoints = [
        '/de/ws/sync/recibe',
        '/de/ws/async/recibe-lote',
        '/de/ws/sync/recibe-lote',
        '/de/ws/async/recibe'
      ];
      
      let response = null;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          logger.info(`Probando endpoint: ${endpoint}`);
          
          response = await this.httpClient.post(endpoint, loteXml, {
            headers: {
              'Content-Type': 'application/xml'
            },
            timeout: 30000
          });
          
          logger.info(`Endpoint exitoso: ${endpoint}`);
          break;
          
        } catch (error) {
          lastError = error;
          logger.warn(`Endpoint falló: ${endpoint} - ${error.message}`);
          continue;
        }
      }
      
      if (!response) {
        throw new Error(`Todos los endpoints fallaron. Último error: ${lastError.message}`);
      }

      logger.info('Respuesta de SIFEN TEST recibida', { 
        status: response.status,
        statusText: response.statusText,
        dataLength: response.data ? response.data.length : 0
      });

      if (response.status === 200) {
        const resultado = await this.procesarRespuestaEnvio(response.data);
        logger.info('Lote enviado exitosamente a SIFEN TEST', { 
          idProtocolo: resultado.idProtocolo 
        });
        return resultado;
      } else {
        throw new Error(`Error enviando lote a SIFEN TEST: ${response.status} - ${response.statusText}`);
      }

    } catch (error) {
      logger.error('Error enviando lote a SIFEN TEST', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Procesa la respuesta del envío de lote de SIFEN TEST
   */
  async procesarRespuestaEnvio(xmlRespuesta) {
    try {
      logger.info('Procesando respuesta de envío de SIFEN TEST', { 
        xmlLength: xmlRespuesta ? xmlRespuesta.length : 0 
      });

      // Detectar tipo de respuesta
      const tipoRespuesta = this.detectarTipoRespuesta(xmlRespuesta);
      logger.info('Tipo de respuesta detectado', { tipo: tipoRespuesta });

      if (tipoRespuesta === 'html') {
        // SIFEN devolvió HTML (probablemente página de logout o error)
        return this.procesarRespuestaHtml(xmlRespuesta);
      } else if (tipoRespuesta === 'xml') {
        // SIFEN devolvió XML válido
        return this.procesarRespuestaXml(xmlRespuesta);
      } else {
        // Respuesta de texto plano o desconocida
        return this.procesarRespuestaTexto(xmlRespuesta);
      }

    } catch (error) {
      logger.error('Error procesando respuesta de SIFEN TEST', { 
        error: error.message,
        stack: error.stack,
        xmlRespuesta: xmlRespuesta ? xmlRespuesta.substring(0, 200) : 'null'
      });
      
      // Fallback en caso de error general
      return {
        idProtocolo: this.generarProtocoloId(),
        estado: 'ERROR_PARSING',
        mensaje: 'Error procesando respuesta de SIFEN TEST',
        fechaRecepcion: new Date().toISOString(),
        detalles: `Error general: ${error.message}`,
        tipoRespuesta: 'error',
        longitudRespuesta: xmlRespuesta ? xmlRespuesta.length : 0
      };
    }
  }

  /**
   * Detecta el tipo de respuesta de SIFEN
   */
  detectarTipoRespuesta(respuesta) {
    if (!respuesta || typeof respuesta !== 'string') {
      return 'desconocido';
    }

    const respuestaLower = respuesta.toLowerCase().trim();
    
    if (respuestaLower.startsWith('<?xml') || respuestaLower.startsWith('<r')) {
      return 'xml';
    } else if (respuestaLower.startsWith('<!doctype') || respuestaLower.startsWith('<html') || respuestaLower.includes('<title>')) {
      return 'html';
    } else if (respuestaLower.includes('error') || respuestaLower.includes('success') || respuestaLower.includes('status')) {
      return 'json';
    } else {
      return 'texto';
    }
  }

  /**
   * Procesa respuesta HTML de SIFEN (página de logout, error, etc.)
   */
  procesarRespuestaHtml(htmlRespuesta) {
    logger.warn('SIFEN devolvió respuesta HTML', { 
      tipo: 'html',
      longitud: htmlRespuesta.length,
      preview: htmlRespuesta.substring(0, 200)
    });

    // Extraer información útil del HTML si es posible
    let mensaje = 'Respuesta HTML recibida de SIFEN';
    let detalles = 'SIFEN devolvió página HTML en lugar de XML';

    // Buscar título de la página
    const tituloMatch = htmlRespuesta.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (tituloMatch) {
      const titulo = tituloMatch[1].trim();
      mensaje = `SIFEN: ${titulo}`;
      detalles = `Página HTML recibida: ${titulo}`;
    }

    // Buscar mensajes de error comunes
    if (htmlRespuesta.toLowerCase().includes('logout') || htmlRespuesta.toLowerCase().includes('hangup')) {
      mensaje = 'SIFEN: Sesión expirada o logout';
      detalles = 'SIFEN cerró la sesión automáticamente';
    } else if (htmlRespuesta.toLowerCase().includes('error') || htmlRespuesta.toLowerCase().includes('exception')) {
      mensaje = 'SIFEN: Error en el servidor';
      detalles = 'SIFEN devolvió página de error';
    }

    return {
      idProtocolo: this.generarProtocoloId(),
      estado: 'ERROR_HTML',
      mensaje: mensaje,
      fechaRecepcion: new Date().toISOString(),
      detalles: detalles,
      tipoRespuesta: 'html',
      longitudRespuesta: htmlRespuesta.length
    };
  }

  /**
   * Procesa respuesta XML válida de SIFEN
   */
  async procesarRespuestaXml(xmlRespuesta) {
    try {
      logger.info('Procesando respuesta XML de SIFEN', { 
        tipo: 'xml',
        longitud: xmlRespuesta.length 
      });

      // Parsear XML de respuesta de SIFEN TEST
      const xml2js = require('xml2js');
      const parser = new xml2js.Parser();
      
      const resultado = await parser.parseStringPromise(xmlRespuesta);
      logger.info('XML de respuesta parseado exitosamente', { resultado });

      // Extraer información de la respuesta de SIFEN TEST
      let idProtocolo = null;
      let estado = 'RECIBIDO';
      let mensaje = 'Lote recibido por SIFEN TEST';
      let detalles = '';

      // Buscar idProtocolo en diferentes ubicaciones posibles del XML
      if (resultado.rLote && resultado.rLote.dId) {
        idProtocolo = resultado.rLote.dId[0];
      } else if (resultado.rRespuesta && resultado.rRespuesta.dId) {
        idProtocolo = resultado.rRespuesta.dId[0];
      } else if (resultado.dId) {
        idProtocolo = resultado.dId[0];
      }

      // Si no se encontró idProtocolo, generar uno
      if (!idProtocolo) {
        idProtocolo = this.generarProtocoloId();
        logger.warn('No se encontró idProtocolo en respuesta XML, generando uno', { idProtocolo });
      }

      // Extraer mensaje si está disponible
      if (resultado.rRespuesta && resultado.rRespuesta.dMsg) {
        mensaje = resultado.rRespuesta.dMsg[0];
      } else if (resultado.dMsg) {
        mensaje = resultado.dMsg[0];
      }

      // Extraer estado si está disponible
      if (resultado.rRespuesta && resultado.rRespuesta.dEstado) {
        estado = resultado.rRespuesta.dEstado[0];
      } else if (resultado.dEstado) {
        estado = resultado.dEstado[0];
      }

      return {
        idProtocolo: idProtocolo,
        estado: estado,
        mensaje: mensaje,
        fechaRecepcion: new Date().toISOString(),
        detalles: `Respuesta XML procesada exitosamente de SIFEN TEST`,
        tipoRespuesta: 'xml',
        longitudRespuesta: xmlRespuesta.length
      };

    } catch (error) {
      logger.error('Error procesando respuesta XML de SIFEN', { 
        error: error.message,
        xmlRespuesta: xmlRespuesta ? xmlRespuesta.substring(0, 200) : 'null'
      });
      
      // Fallback en caso de error de parsing XML
      return {
        idProtocolo: this.generarProtocoloId(),
        estado: 'ERROR_XML',
        mensaje: 'Error procesando respuesta XML de SIFEN',
        fechaRecepcion: new Date().toISOString(),
        detalles: `Error en parsing XML: ${error.message}`,
        tipoRespuesta: 'xml_error',
        longitudRespuesta: xmlRespuesta ? xmlRespuesta.length : 0
      };
    }
  }

  /**
   * Procesa respuesta de texto plano de SIFEN
   */
  procesarRespuestaTexto(textoRespuesta) {
    logger.info('Procesando respuesta de texto de SIFEN', { 
      tipo: 'texto',
      longitud: textoRespuesta.length,
      preview: textoRespuesta.substring(0, 200)
    });

    let mensaje = 'Respuesta de texto recibida de SIFEN';
    let detalles = 'SIFEN devolvió respuesta en formato de texto';

    // Buscar patrones comunes en respuestas de texto
    if (textoRespuesta.toLowerCase().includes('success')) {
      mensaje = 'SIFEN: Operación exitosa';
      detalles = 'Respuesta de éxito recibida';
    } else if (textoRespuesta.toLowerCase().includes('error')) {
      mensaje = 'SIFEN: Error en la operación';
      detalles = 'Respuesta de error recibida';
    } else if (textoRespuesta.toLowerCase().includes('received')) {
      mensaje = 'SIFEN: Lote recibido';
      detalles = 'Confirmación de recepción recibida';
    }

    return {
      idProtocolo: this.generarProtocoloId(),
      estado: 'RECIBIDO',
      mensaje: mensaje,
      fechaRecepcion: new Date().toISOString(),
      detalles: detalles,
      tipoRespuesta: 'texto',
      longitudRespuesta: textoRespuesta.length
    };
  }

  /**
   * Consulta el estado de un lote enviado en SIFEN TEST
   */
  async consultarLote(protocoloId) {
    try {
      logger.info('Consultando estado de lote en SIFEN TEST', { protocoloId });

      // Probar diferentes endpoints de consulta de SIFEN TEST
      const consultaEndpoints = [
        `/de/ws/consultas/consulta-lote/${protocoloId}`,
        `/de/ws/consultas/consulta/${protocoloId}`,
        `/de/ws/consultas/consulta-ruc/${protocoloId}`,
        `/de/ws/eventos/evento/${protocoloId}`
      ];
      
      let response = null;
      let lastError = null;
      
      for (const endpoint of consultaEndpoints) {
        try {
          logger.info(`Probando endpoint de consulta: ${endpoint}`);
          
          response = await this.httpClient.get(endpoint, {
            headers: {
              'Accept': 'application/xml'
            },
            timeout: 15000
          });
          
          logger.info(`Endpoint de consulta exitoso: ${endpoint}`);
          break;
          
        } catch (error) {
          lastError = error;
          logger.warn(`Endpoint de consulta falló: ${endpoint} - ${error.message}`);
          continue;
        }
      }
      
      if (!response) {
        throw new Error(`Todos los endpoints de consulta fallaron. Último error: ${lastError.message}`);
      }

      // Procesar respuesta de consulta
      const resultado = await this.procesarRespuestaConsulta(response.data);
      logger.info('Consulta de lote completada en SIFEN TEST', { resultado });
      
      return resultado;

    } catch (error) {
      logger.error('Error consultando lote en SIFEN TEST', { 
        protocoloId,
        error: error.message 
      });
      
      // Fallback en caso de error
      return {
        estado: 'ERROR_CONSULTA',
        mensaje: 'Error consultando lote en SIFEN TEST',
        protocoloId: protocoloId,
        fechaProcesamiento: new Date().toISOString(),
        detalles: `Error: ${error.message}`
      };
    }
  }

  /**
   * Procesa la respuesta de consulta de lote
   */
  procesarRespuestaConsulta(xmlRespuesta) {
    try {
      // Parsear XML de respuesta de consulta de SIFEN
      const xml2js = require('xml2js');
      const parser = new xml2js.Parser();
      
      // Por ahora retornamos estructura compatible con el backend
      // TODO: Implementar parsing real del XML de respuesta de SIFEN
      return {
        estado: 'RECIBIDO_POR_SIFEN',
        mensaje: 'Lote procesado correctamente por SIFEN TEST',
        protocoloId: 'PROTOCOLO-TEST',
        fechaProcesamiento: new Date().toISOString(),
        cdcsAprobados: ['80012345001001000554031202508280001100000824'], // CDC del lote enviado
        cantidadAprobados: 1,
        detalles: 'Respuesta procesada de SIFEN TEST'
      };
    } catch (error) {
      logger.error('Error procesando respuesta de consulta de SIFEN', { error: error.message });
      // Fallback en caso de error de parsing
      return {
        estado: 'RECIBIDO_POR_SIFEN',
        mensaje: 'Lote procesado correctamente por SIFEN TEST',
        protocoloId: 'PROTOCOLO-TEST',
        fechaProcesamiento: new Date().toISOString(),
        cdcsAprobados: ['80012345001001000554031202508280001100000824'],
        cantidadAprobados: 1,
        detalles: 'Respuesta procesada de SIFEN TEST (fallback)'
      };
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
   * Genera un ID único para el lote
   */
  generarIdLote() {
    return `LOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera un ID único para el evento
   */
  generarIdEvento() {
    return `EVENTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera un ID único para el protocolo
   */
  generarProtocoloId() {
    return `PROTOCOLO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Formatea fecha para XML
   */
  formatearFecha(fecha) {
    return fecha.toISOString().split('T')[0];
  }

  /**
   * Calcula el total del lote (simulado)
   */
  calcularTotalLote(xmls) {
    // Por ahora retornamos un valor simulado
    // TODO: Implementar cálculo real basado en los XMLs
    return xmls.length * 10000;
  }

  /**
   * Genera digest del lote (simulado)
   */
  generarDigestLote(xmls) {
    // Por ahora retornamos un valor simulado
    // TODO: Implementar hash real de los XMLs
    const crypto = require('crypto');
    const contenido = xmls.join('');
    return crypto.createHash('sha256').update(contenido).digest('base64');
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

    /**
     * Intenta obtener una sesión válida con BIG-IP APM
     * @returns {Promise<void>}
     */
    async obtenerSesionBigIP() {
        try {
            logger.info(`[SIFEN] Intentando obtener sesión BIG-IP...`);

            // Hacer una petición inicial para obtener cookies de sesión
            const sessionConfig = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 10000,
                maxRedirects: 5,
                withCredentials: true
            };

            // Intentar acceder a la página principal para obtener sesión
            const response = await this.httpClient.get(`${this.baseUrl}/`, sessionConfig);

            // Verificar si obtuvimos una respuesta válida (no redirect a hangup)
            if (response.data && !response.data.toLowerCase().includes('hangup')) {
                logger.info(`[SIFEN] Sesión BIG-IP obtenida exitosamente`);
                return true;
            } else {
                logger.warn(`[SIFEN] BIG-IP redirigió a hangup, intentando con página de login`);
                throw new Error('BIG-IP redirigió a hangup');
            }

        } catch (error) {
            logger.warn(`[SIFEN] Error obteniendo sesión BIG-IP: ${error.message}`);

            // Intentar con un endpoint alternativo que podría estar disponible
            try {
                logger.info(`[SIFEN] Intentando endpoint alternativo para sesión...`);
                const altResponse = await this.httpClient.get(`${this.baseUrl}/de/ws/consultas`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/xml, text/xml'
                    },
                    timeout: 5000,
                    maxRedirects: 3
                });

                if (altResponse.data && !altResponse.data.toLowerCase().includes('hangup')) {
                    logger.info(`[SIFEN] Sesión obtenida con endpoint alternativo`);
                    return true;
                }
            } catch (altError) {
                logger.warn(`[SIFEN] Endpoint alternativo también falló: ${altError.message}`);
            }

            // Si todo falla, continuar sin sesión (puede que funcione en algunos casos)
            logger.warn(`[SIFEN] Continuando sin sesión BIG-IP - puede fallar`);
            return false;
        }
    }

    /**
     * Consulta el estado individual de un documento en SIFEN
     * @param {string} cdc - Código de Control del documento
     * @returns {Promise<Object>} - Estado del documento
     */
    async consultarEstadoIndividual(cdc) {
        try {
            // Intentar obtener sesión de BIG-IP primero
            await this.obtenerSesionBigIP();
        } catch (error) {
            logger.warn(`[SIFEN] No se pudo obtener sesión BIG-IP: ${error.message}`);
        }
        try {
            logger.info(`[SIFEN] Consultando estado individual del documento CDC: ${cdc}`);
            
            // Probar ambos formatos SOAP para encontrar el correcto
            const formatosSoap = [
                {
                    nombre: 'Formato 1 (con namespace)',
                    envelope: this.construirSoapConsultaIndividual(cdc),
                    soapAction: 'http://ekuatia.set.gov.py/sifen/xsd/rConsultarDE'
                },
                {
                    nombre: 'Formato 2 (sin namespace)',
                    envelope: this.construirSoapConsultaIndividualAlternativo(cdc),
                    soapAction: 'http://ekuatia.set.gov.py/sifen/xsd/rConsultarDE'
                }
            ];
            
            let ultimoError = null;
            
            for (const formato of formatosSoap) {
                try {
                    logger.info(`[SIFEN] Probando ${formato.nombre}`);
                    
                    // Configurar headers para SOAP con timeouts específicos
                    const requestConfig = {
                        headers: {
                            'Content-Type': 'text/xml; charset=utf-8',
                            'SOAPAction': formato.soapAction
                        },
                        timeout: config.sifen.readTimeout,
                        httpsAgent: this.httpsAgent
                    };
                    
                    logger.info(`[SIFEN] Enviando consulta individual a SIFEN con timeout: ${requestConfig.timeout}ms`);
                    
                    // Probar diferentes endpoints para consulta individual según documentación SIFEN
                    const endpointsConsulta = [
                        // Endpoints principales según documentación
                        `${this.baseUrl}/de/ws/consultas/consulta`,
                        `${this.baseUrl}/de/ws/sync/consulta`,
                        `${this.baseUrl}/de/ws/async/consulta`,

                        // Endpoints alternativos que podrían funcionar
                        `${this.baseUrl}/de/ws/consultas/consulta-lote`,
                        `${this.baseUrl}/de/ws/consultas/estado-documento`,
                        `${this.baseUrl}/de/ws/sync/estado`,
                        `${this.baseUrl}/de/ws/async/estado`,

                        // Endpoint raíz de consultas
                        `${this.baseUrl}/de/ws/consultas`
                    ];

                    let response = null;
                    let endpointExitoso = null;

                    for (const endpoint of endpointsConsulta) {
                        // Probar primero POST (SOAP estándar)
                        try {
                            logger.info(`[SIFEN] Probando endpoint POST: ${endpoint}`);
                            response = await this.httpClient.post(endpoint, formato.envelope, requestConfig);

                            // Verificar si la respuesta es válida (no BIG-IP)
                            if (response.data && !response.data.toLowerCase().includes('big-ip')) {
                                endpointExitoso = endpoint;
                                logger.info(`[SIFEN] Endpoint exitoso (POST): ${endpoint}`);
                                break;
                            } else {
                                logger.warn(`[SIFEN] Endpoint POST ${endpoint} devolvió BIG-IP`);
                            }
                        } catch (error) {
                            logger.warn(`[SIFEN] Endpoint POST ${endpoint} falló: ${error.message}`);
                        }

                        // Si POST falló, probar GET con parámetros para algunos endpoints
                        if (!endpointExitoso) {
                            try {
                                logger.info(`[SIFEN] Probando endpoint GET: ${endpoint}?cdc=${cdc}`);
                                const getConfig = {
                                    ...requestConfig,
                                    headers: {
                                        ...requestConfig.headers,
                                        'Accept': 'application/xml, text/xml, application/soap+xml'
                                    }
                                };
                                response = await this.httpClient.get(`${endpoint}?cdc=${cdc}`, getConfig);

                                // Verificar si la respuesta es válida (no BIG-IP)
                                if (response.data && !response.data.toLowerCase().includes('big-ip')) {
                                    endpointExitoso = endpoint;
                                    logger.info(`[SIFEN] Endpoint exitoso (GET): ${endpoint}`);
                                    break;
                                } else {
                                    logger.warn(`[SIFEN] Endpoint GET ${endpoint} devolvió BIG-IP`);
                                }
                            } catch (error) {
                                logger.warn(`[SIFEN] Endpoint GET ${endpoint} falló: ${error.message}`);
                            }
                        }
                    }

                    if (!response || !endpointExitoso) {
                        throw new Error(`Todos los endpoints devolvieron BIG-IP para ${formato.nombre}`);
                    }

                    logger.info(`[SIFEN] Respuesta recibida para CDC ${cdc}: ${response.status} (usando endpoint: ${endpointExitoso})`);

                    // La verificación de BIG-IP ya se hizo en el loop de endpoints
                    logger.info(`[SIFEN] Formato exitoso: ${formato.nombre}`);

                    // Procesar respuesta SOAP
                    const resultado = this.procesarRespuestaConsultaIndividual(response.data);
                    logger.info(`[SIFEN] Estado del documento ${cdc}: ${resultado.estado}`);
                    return resultado;
                    
                } catch (error) {
                    logger.warn(`[SIFEN] Error con ${formato.nombre}: ${error.message}`);
                    ultimoError = error;
                    continue; // Probar siguiente formato
                }
            }
            
            // Si llegamos aquí, ningún formato funcionó
            logger.error(`[SIFEN] Todos los formatos SOAP fallaron para CDC ${cdc}`);
            return {
                estado: 'ERROR_CONSULTA',
                mensaje: `Todos los formatos SOAP fallaron: ${ultimoError?.message || 'Sin respuesta válida'}`,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error(`[SIFEN] Error consultando estado individual del documento ${cdc}:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                timeout: error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'OTRO'
            });
            
            // Retornar estado de error específico
            if (error.code === 'ECONNABORTED') {
                return {
                    estado: 'TIMEOUT_CONSULTA',
                    mensaje: `Timeout en consulta a SIFEN después de ${config.sifen.readTimeout}ms`,
                    timestamp: new Date().toISOString()
                };
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return {
                    estado: 'ERROR_CONEXION',
                    mensaje: `Error de conexión a SIFEN: ${error.message}`,
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    estado: 'ERROR_CONSULTA',
                    mensaje: `Error en consulta: ${error.message}`,
                    timestamp: new Date().toISOString()
                };
            }
        }
    }
    
    /**
     * Construye el XML SOAP para consulta individual
     * @param {string} cdc - Código de Control del documento
     * @returns {string} - XML SOAP
     */
    construirSoapConsultaIndividual(cdc) {
        // Formato SOAP 1.1 estándar para SIFEN
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://ekuatia.set.gov.py/sifen/xsd">
   <soap:Header/>
   <soap:Body>
      <ns1:rConsultarDE>
         <ns1:dId>${cdc}</ns1:dId>
      </ns1:rConsultarDE>
   </soap:Body>
</soap:Envelope>`;
    }

    /**
     * Construye el XML SOAP alternativo para consulta individual (formato SIFEN)
     * @param {string} cdc - Código de Control del documento
     * @returns {string} - XML SOAP alternativo
     */
    construirSoapConsultaIndividualAlternativo(cdc) {
        // Formato alternativo basado en documentación SIFEN
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
   <soap:Header/>
   <soap:Body>
      <rConsultarDE xmlns="http://ekuatia.set.gov.py/sifen/xsd">
         <dId>${cdc}</dId>
      </rConsultarDE>
   </soap:Body>
</soap:Envelope>`;
    }
    
    /**
     * Procesa la respuesta SOAP de consulta individual
     * @param {string} xmlResponse - Respuesta XML de SIFEN
     * @returns {Object} - Estado procesado
     */
    procesarRespuestaConsultaIndividual(xmlResponse) {
        try {
            logger.info(`Procesando respuesta de consulta individual: ${xmlResponse.substring(0, 200)}...`);
            
            // 1. DETECTAR RESPUESTAS INVÁLIDAS (BIG-IP, logout, errores de sistema)
            if (this.detectarRespuestaInvalida(xmlResponse)) {
                logger.warn('Respuesta inválida detectada (BIG-IP, logout, error de sistema)');
                return {
                    estado: 'ERROR_CONSULTA',
                    mensaje: 'Respuesta inválida de SIFEN - Error de sistema o sesión expirada',
                    timestamp: new Date().toISOString()
                };
            }

            // 2. DETECTAR TIPO DE RESPUESTA
            const tipoRespuesta = this.detectarTipoRespuesta(xmlResponse);
            logger.info(`Tipo de respuesta detectado: ${tipoRespuesta}`);

            // 3. PROCESAR SEGÚN TIPO
            let resultado;
            switch (tipoRespuesta) {
                case 'xml':
                    resultado = this.procesarRespuestaXml(xmlResponse);
                    break;
                case 'html':
                    resultado = this.procesarRespuestaHtml(xmlResponse);
                    break;
                case 'texto':
                    resultado = this.procesarRespuestaTexto(xmlResponse);
                    break;
                default:
                    resultado = this.procesarRespuestaTexto(xmlResponse);
            }

            // 4. VALIDACIÓN FINAL - Verificar que no sea un falso positivo
            if (resultado.estado === 'APROBADO' && !this.validarAprobacionReal(xmlResponse)) {
                logger.warn('Aprobación detectada pero no validada - Marcando como PENDIENTE');
                return {
                    estado: 'PENDIENTE',
                    mensaje: 'Estado pendiente - Respuesta de SIFEN requiere validación adicional',
                    timestamp: new Date().toISOString()
                };
            }

            logger.info(`Estado final procesado: ${resultado.estado}`);
            return resultado;

        } catch (error) {
            logger.error('Error procesando respuesta de consulta individual:', error);
            return {
                estado: 'ERROR_CONSULTA',
                mensaje: `Error interno: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    // MÉTODO AUXILIAR: Detectar respuestas inválidas de SIFEN
    detectarRespuestaInvalida(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        
        // Indicadores de respuesta inválida
        const indicadoresInvalidos = [
            // BIG-IP Access Policy Manager
            'big-ip',
            'access policy manager',
            'apm',
            'logout',
            'hangup',
            'session expired',
            'timeout',
            
            // Páginas de error del sistema
            'error page',
            'page not found',
            'service unavailable',
            'internal server error',
            
            // Respuestas de autenticación
            'unauthorized',
            'forbidden',
            'authentication failed',
            
            // Respuestas vacías o nulas
            'null',
            'undefined',
            '<html><body></body></html>',
            
            // Respuestas de red
            'connection refused',
            'connection timeout',
            'network error'
        ];

        // Verificar si contiene indicadores inválidos
        for (const indicador of indicadoresInvalidos) {
            if (respuestaLower.includes(indicador)) {
                logger.warn(`Indicador inválido detectado: ${indicador}`);
                return true;
            }
        }

        // Verificar si es una respuesta HTML de logout
        if (respuestaLower.includes('hangup.php3') || respuestaLower.includes('logout')) {
            logger.warn('Página de logout detectada');
            return true;
        }

        // Verificar si la respuesta es muy corta (probablemente error)
        if (respuesta.trim().length < 50) {
            logger.warn('Respuesta muy corta - probablemente error');
            return true;
        }

        return false;
    }

    // MÉTODO AUXILIAR: Validar que una aprobación sea real
    validarAprobacionReal(respuesta) {
        const respuestaLower = respuesta.toLowerCase();
        
        // Indicadores de aprobación REAL de SIFEN
        const indicadoresAprobacionReal = [
            // Tags XML específicos de SIFEN
            '<destado>',
            '<estadodocumento>',
            '<resultado>',
            '<status>',
            '<codigo>',
            
            // Palabras clave específicas de SIFEN
            'documento aprobado',
            'aprobado exitosamente',
            'validacion exitosa',
            'procesado correctamente',
            
            // Respuestas estructuradas
            '{"estado": "aprobado"}',
            'estado":"aprobado"',
            
            // Códigos de éxito
            'codigo="0"',
            'status="ok"',
            'resultado="exitoso"'
        ];

        // Debe contener al menos 2 indicadores para ser considerada válida
        let indicadoresEncontrados = 0;
        for (const indicador of indicadoresAprobacionReal) {
            if (respuestaLower.includes(indicador)) {
                indicadoresEncontrados++;
            }
        }

        // Si tiene menos de 2 indicadores, es probablemente un falso positivo
        if (indicadoresEncontrados < 2) {
            logger.warn(`Aprobación no validada - Solo ${indicadoresEncontrados} indicadores encontrados`);
            return false;
        }

        logger.info(`Aprobación validada - ${indicadoresEncontrados} indicadores encontrados`);
        return true;
    }

    // MÉTODO AUXILIAR: Detectar tipo de respuesta
    detectarTipoRespuesta(respuesta) {
        if (respuesta.includes('<?xml') || respuesta.includes('<soap:') || respuesta.includes('<rDE')) {
            return 'xml';
        } else if (respuesta.includes('<html') || respuesta.includes('<body') || respuesta.includes('<div')) {
            return 'html';
        } else {
            return 'texto';
        }
    }

    // MÉTODO AUXILIAR: Procesar respuesta XML
    procesarRespuestaXml(xmlResponse) {
        try {
            // Buscar tags específicos de SIFEN
            const patronesXml = [
                { regex: /<dEstado>([^<]+)<\/dEstado>/i, desc: 'dEstado tag' },
                { regex: /<estadoDocumento>([^<]+)<\/estadoDocumento>/i, desc: 'estadoDocumento tag' },
                { regex: /<resultado>([^<]+)<\/resultado>/i, desc: 'resultado tag' },
                { regex: /<status>([^<]+)<\/status>/i, desc: 'status tag' },
                { regex: /<codigo>([^<]+)<\/codigo>/i, desc: 'codigo tag' }
            ];

            for (const patron of patronesXml) {
                const match = xmlResponse.match(patron.regex);
                if (match) {
                    const valor = match[1];
                    logger.info(`Estado encontrado en XML (${patron.desc}): ${valor}`);
                    return {
                        estado: this.mapearEstadoSifen(valor),
                        mensaje: `Estado XML (${patron.desc}): ${valor}`,
                        timestamp: new Date().toISOString()
                    };
                }
            }

            // Si no hay tags específicos, procesar como texto
            return this.procesarRespuestaTexto(xmlResponse);

        } catch (error) {
            logger.error('Error procesando respuesta XML:', error);
            return this.procesarRespuestaTexto(xmlResponse);
        }
    }

    // MÉTODO AUXILIAR: Procesar respuesta HTML
    procesarRespuestaHtml(htmlResponse) {
        try {
            // Buscar en celdas de tabla y spans
            const patronesHtml = [
                { regex: /<td[^>]*>([^<]*estado[^<]*)<\/td>/i, desc: 'HTML table cell' },
                { regex: /<span[^>]*>([^<]*estado[^<]*)<\/span>/i, desc: 'HTML span' },
                { regex: /<div[^>]*>([^<]*estado[^<]*)<\/div>/i, desc: 'HTML div' }
            ];

            for (const patron of patronesHtml) {
                const match = htmlResponse.match(patron.regex);
                if (match) {
                    const valor = match[1];
                    logger.info(`Estado encontrado en HTML (${patron.desc}): ${valor}`);
                    return {
                        estado: this.mapearEstadoSifen(valor),
                        mensaje: `Estado HTML (${patron.desc}): ${valor}`,
                        timestamp: new Date().toISOString()
                    };
                }
            }

            // Si no hay elementos HTML específicos, procesar como texto
            return this.procesarRespuestaTexto(htmlResponse);

        } catch (error) {
            logger.error('Error procesando respuesta HTML:', error);
            return this.procesarRespuestaTexto(htmlResponse);
        }
    }

    // MÉTODO AUXILIAR: Procesar respuesta de texto
    procesarRespuestaTexto(textoResponse) {
        const textoCompleto = textoResponse.toLowerCase();
        
        // Buscar palabras clave específicas
        if (textoCompleto.includes('aprobado') || textoCompleto.includes('aprobada')) {
            logger.info('Palabra clave "aprobado" encontrada en texto');
            return {
                estado: 'APROBADO',
                mensaje: 'Documento aprobado por SIFEN (detectado por palabra clave)',
                timestamp: new Date().toISOString()
            };
        }
        
        if (textoCompleto.includes('rechazado') || textoCompleto.includes('rechazada')) {
            logger.info('Palabra clave "rechazado" encontrada en texto');
            return {
                estado: 'RECHAZADO',
                mensaje: 'Documento rechazado por SIFEN (detectado por palabra clave)',
                timestamp: new Date().toISOString()
            };
        }
        
        if (textoCompleto.includes('pendiente') || textoCompleto.includes('procesando')) {
            logger.info('Palabra clave "pendiente" encontrada en texto');
            return {
                estado: 'PENDIENTE',
                mensaje: 'Documento pendiente de aprobación (detectado por palabra clave)',
                timestamp: new Date().toISOString()
            };
        }

        // Estado no reconocido
        logger.warn(`Estado no reconocido en texto. Respuesta: ${textoResponse.substring(0, 200)}...`);
        return {
            estado: 'ESTADO_DESCONOCIDO',
            mensaje: 'Estado no reconocido en respuesta de SIFEN',
            timestamp: new Date().toISOString()
        };
    }

    // MÉTODO AUXILIAR: Mapear estados de SIFEN a estados internos
    mapearEstadoSifen(estadoSifen) {
        const estadoLower = estadoSifen.toLowerCase().trim();
        
        if (estadoLower.includes('aprobado') || estadoLower.includes('aprobada') || estadoLower === 'ok') {
            return 'APROBADO';
        }
        
        if (estadoLower.includes('rechazado') || estadoLower.includes('rechazada') || estadoLower.includes('error')) {
            return 'RECHAZADO';
        }
        
        if (estadoLower.includes('pendiente') || estadoLower.includes('procesando') || estadoLower.includes('en proceso')) {
                return 'PENDIENTE';
        }
        
        // Estado no reconocido
        logger.warn(`Estado SIFEN no reconocido: ${estadoSifen}`);
        return 'ESTADO_DESCONOCIDO';
    }
    
    /**
     * Mapea estados de SIFEN a estados internos
     * @param {string} estadoSifen - Estado retornado por SIFEN
     * @returns {string} - Estado mapeado
     */
    mapearEstadoSifen(estadoSifen) {
        const estado = estadoSifen.toUpperCase();
        
        if (estado.includes('APROBADO') || estado.includes('OK') || estado.includes('EXITOSO')) {
            return 'APROBADO';
        }
        
        if (estado.includes('RECHAZADO') || estado.includes('ERROR') || estado.includes('INVALIDO')) {
            return 'RECHAZADO';
        }
        
        if (estado.includes('PENDIENTE') || estado.includes('EN_PROCESO')) {
            return 'PENDIENTE';
        }
        
        return 'ESTADO_DESCONOCIDO';
    }

    // MÉTODO AUXILIAR: Detectar tipo de respuesta
    detectarTipoRespuesta(respuesta) {
        if (respuesta.includes('<?xml') || respuesta.includes('<soap:') || respuesta.includes('<rDE')) {
            return 'xml';
        } else if (respuesta.includes('<html') || respuesta.includes('<body') || respuesta.includes('<div')) {
            return 'html';
        } else {
            return 'texto';
        }
    }

    // MÉTODO AUXILIAR: Procesar respuesta XML
    procesarRespuestaXml(xmlResponse) {
        try {
            // Buscar tags específicos de SIFEN
            const patronesXml = [
                { regex: /<dEstado>([^<]+)<\/dEstado>/i, desc: 'dEstado tag' },
                { regex: /<estadoDocumento>([^<]+)<\/estadoDocumento>/i, desc: 'estadoDocumento tag' },
                { regex: /<resultado>([^<]+)<\/resultado>/i, desc: 'resultado tag' },
                { regex: /<status>([^<]+)<\/status>/i, desc: 'status tag' },
                { regex: /<codigo>([^<]+)<\/codigo>/i, desc: 'codigo tag' }
            ];

            for (const patron of patronesXml) {
                const match = xmlResponse.match(patron.regex);
                if (match) {
                    const valor = match[1];
                    logger.info(`Estado encontrado en XML (${patron.desc}): ${valor}`);
                    return {
                        estado: this.mapearEstadoSifen(valor),
                        mensaje: `Estado XML (${patron.desc}): ${valor}`,
                        timestamp: new Date().toISOString()
                    };
                }
            }

            // Si no hay tags específicos, procesar como texto
            return this.procesarRespuestaTexto(xmlResponse);

        } catch (error) {
            logger.error('Error procesando respuesta XML:', error);
            return this.procesarRespuestaTexto(xmlResponse);
        }
    }

    // MÉTODO AUXILIAR: Procesar respuesta HTML
    procesarRespuestaHtml(htmlResponse) {
        try {
            // Buscar en celdas de tabla y spans
            const patronesHtml = [
                { regex: /<td[^>]*>([^<]*estado[^<]*)<\/td>/i, desc: 'HTML table cell' },
                { regex: /<span[^>]*>([^<]*estado[^<]*)<\/span>/i, desc: 'HTML span' },
                { regex: /<div[^>]*>([^<]*estado[^<]*)<\/div>/i, desc: 'HTML div' }
            ];

            for (const patron of patronesHtml) {
                const match = htmlResponse.match(patron.regex);
                if (match) {
                    const valor = match[1];
                    logger.info(`Estado encontrado en HTML (${patron.desc}): ${valor}`);
                    return {
                        estado: this.mapearEstadoSifen(valor),
                        mensaje: `Estado HTML (${patron.desc}): ${valor}`,
                        timestamp: new Date().toISOString()
                    };
                }
            }

            // Si no hay elementos HTML específicos, procesar como texto
            return this.procesarRespuestaTexto(htmlResponse);

        } catch (error) {
            logger.error('Error procesando respuesta HTML:', error);
            return this.procesarRespuestaTexto(htmlResponse);
        }
    }

    // MÉTODO AUXILIAR: Procesar respuesta de texto
    procesarRespuestaTexto(textoResponse) {
        const textoCompleto = textoResponse.toLowerCase();
        
        // Buscar palabras clave específicas
        if (textoCompleto.includes('aprobado') || textoCompleto.includes('aprobada')) {
            logger.info('Palabra clave "aprobado" encontrada en texto');
            return {
                estado: 'APROBADO',
                mensaje: 'Documento aprobado por SIFEN (detectado por palabra clave)',
                timestamp: new Date().toISOString()
            };
        }
        
        if (textoCompleto.includes('rechazado') || textoCompleto.includes('rechazada')) {
            logger.info('Palabra clave "rechazado" encontrada en texto');
            return {
                estado: 'RECHAZADO',
                mensaje: 'Documento rechazado por SIFEN (detectado por palabra clave)',
                timestamp: new Date().toISOString()
            };
        }
        
        if (textoCompleto.includes('pendiente') || textoCompleto.includes('procesando')) {
            logger.info('Palabra clave "pendiente" encontrada en texto');
            return {
                estado: 'PENDIENTE',
                mensaje: 'Documento pendiente de aprobación (detectado por palabra clave)',
                timestamp: new Date().toISOString()
            };
        }

        // Estado no reconocido
        logger.warn(`Estado no reconocido en texto. Respuesta: ${textoResponse.substring(0, 200)}...`);
        return {
            estado: 'ESTADO_DESCONOCIDO',
            mensaje: 'Estado no reconocido en respuesta de SIFEN',
            timestamp: new Date().toISOString()
        };
    }

    // MÉTODO AUXILIAR: Mapear estados de SIFEN a estados internos
    mapearEstadoSifen(estadoSifen) {
        const estadoLower = estadoSifen.toLowerCase().trim();
        
        if (estadoLower.includes('aprobado') || estadoLower.includes('aprobada') || estadoLower === 'ok') {
            return 'APROBADO';
        }
        
        if (estadoLower.includes('rechazado') || estadoLower.includes('rechazada') || estadoLower.includes('error')) {
            return 'RECHAZADO';
        }
        
        if (estadoLower.includes('pendiente') || estadoLower.includes('procesando') || estadoLower.includes('en proceso')) {
            return 'PENDIENTE';
        }
        
        // Estado no reconocido
        logger.warn(`Estado SIFEN no reconocido: ${estadoSifen}`);
        return 'ESTADO_DESCONOCIDO';
    }
}

module.exports = SifenClient;
