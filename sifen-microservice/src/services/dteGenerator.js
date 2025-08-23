const xmlBuilder = require('../utils/xmlBuilder');
const xmlSigner = require('./xmlSigner');
const config = require('../config/config');
const logger = require('../utils/logger');

class DteGenerator {
  constructor() {
    this.xmlBuilder = xmlBuilder;
    this.xmlSigner = xmlSigner;
  }

  /**
   * Genera un DTE completo desde los datos de factura
   */
  async generarDte(facturaData) {
    try {
      logger.info('Iniciando generación de DTE', { facturaId: facturaData.id });
      
      // Debug: mostrar estructura de datos recibida
      logger.info('Datos de factura recibidos', { 
        facturaData: JSON.stringify(facturaData, null, 2),
        emisor: facturaData.emisor,
        receptor: facturaData.receptor,
        items: facturaData.items,
        totales: facturaData.totales
      });
      
      // 1. Generar XML base
      const xmlBase = await this.generarXmlBase(facturaData);
      
      // 2. Firmar XML
      const xmlFirmado = await this.xmlSigner.firmarXml(xmlBase);
      
      // 3. Generar CDC (Código de Control)
      const cdc = this.generarCdc(facturaData, xmlFirmado);
      
      // 4. Generar QR
      const qrUrl = this.generarQrUrl(cdc);
      
      logger.info('DTE generado exitosamente', { 
        facturaId: facturaData.id, 
        cdc: cdc 
      });
      
      return {
        cdc: cdc,
        xmlFirmado: xmlFirmado,
        qrUrl: qrUrl,
        estado: 'GENERADO'
      };
      
    } catch (error) {
      logger.error('Error generando DTE', { 
        facturaId: facturaData.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Genera el XML base del DTE según especificación SIFEN
   */
  async generarXmlBase(facturaData) {
    const dteData = {
      // Información del emisor
      emisor: {
        ruc: facturaData.emisor.ruc,
        razonSocial: facturaData.emisor.razonSocial,
        nombreComercial: facturaData.emisor.nombreComercial,
        direccion: facturaData.emisor.direccion,
        telefono: facturaData.emisor.telefono,
        email: facturaData.emisor.email
      },
      
      // Información del receptor
      receptor: {
        ruc: facturaData.receptor.ruc,
        razonSocial: facturaData.receptor.razonSocial,
        direccion: facturaData.receptor.direccion,
        telefono: facturaData.receptor.telefono,
        email: facturaData.receptor.email
      },
      
      // Información del documento
      documento: {
        tipo: facturaData.tipoDocumento, // 1=Factura, 2=Nota de Crédito, etc.
        numero: facturaData.numero,
        fecha: facturaData.fecha,
        moneda: facturaData.moneda,
        tipoCambio: facturaData.tipoCambio || 1,
        condicionOperacion: facturaData.condicionOperacion || 1, // 1=Contado, 2=Crédito
        plazo: facturaData.plazo || 0
      },
      
      // Items del documento
      items: facturaData.items.map(item => ({
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento || 0,
        iva: item.iva || 0,
        total: item.total
      })),
      
      // Totales
      totales: {
        gravada10: facturaData.totales.gravada10 || 0,
        gravada5: facturaData.totales.gravada5 || 0,
        exenta: facturaData.totales.exenta || 0,
        iva10: facturaData.totales.iva10 || 0,
        iva5: facturaData.totales.iva5 || 0,
        total: facturaData.totales.total
      }
    };

    return await this.xmlBuilder.construirXmlDte(dteData);
  }

  /**
   * Genera el CDC (Código de Control) según especificación SIFEN
   */
  generarCdc(facturaData, xmlFirmado) {
    // El CDC se genera con: RUC + DV + TipoDoc + Serie + Numero + TipoEmision + Fecha + Total
    const ruc = facturaData.emisor.ruc;
    const dv = facturaData.emisor.dv || '0';
    const tipoDoc = facturaData.tipoDocumento.toString().padStart(2, '0');
    const serie = facturaData.serie || '001';
    const numero = facturaData.numero.toString().padStart(8, '0');
    const tipoEmision = '1'; // 1=Normal, 2=Contingencia
    const fecha = facturaData.fecha.replace(/[-:]/g, '').substring(0, 8);
    const total = Math.round(facturaData.totales.total).toString().padStart(15, '0');
    
    // Generar hash del XML firmado para completar el CDC
    const hashXml = this.generarHashXml(xmlFirmado);
    
    const cdc = `${ruc}${dv}${tipoDoc}${serie}${numero}${tipoEmision}${fecha}${total}${hashXml}`;
    
    return cdc;
  }

  /**
   * Genera hash del XML para el CDC
   */
  generarHashXml(xml) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(xml);
    return hash.digest('hex').substring(0, 8).toUpperCase();
  }

  /**
   * Genera URL del QR para consulta en SIFEN
   */
  generarQrUrl(cdc) {
    return `${config.sifen.baseUrl}/consulta?cdc=${cdc}`;
  }

  /**
   * Valida que los datos de la factura sean correctos
   */
  validarDatosFactura(facturaData) {
    const errores = [];
    
    if (!facturaData.emisor?.ruc) {
      errores.push('RUC del emisor es requerido');
    }
    
    if (!facturaData.receptor?.ruc) {
      errores.push('RUC del receptor es requerido');
    }
    
    if (!facturaData.numero) {
      errores.push('Número de factura es requerido');
    }
    
    if (!facturaData.fecha) {
      errores.push('Fecha de factura es requerida');
    }
    
    if (!facturaData.items || facturaData.items.length === 0) {
      errores.push('La factura debe tener al menos un item');
    }
    
    if (!facturaData.totales?.total) {
      errores.push('Total de la factura es requerido');
    }
    
    if (errores.length > 0) {
      throw new Error(`Datos de factura inválidos: ${errores.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = new DteGenerator();
