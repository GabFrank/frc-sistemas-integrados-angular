const moment = require('moment');
const xmlValidator = require('../services/xmlValidator');

class XmlBuilder {

  // Función para generar CDC para usar en el XML
  generarCdcParaXml(dteData) {
    // Datos del emisor
    const ruc = dteData.emisor.ruc.toString().replace(/[^0-9]/g, '').substring(0, 8);
    const dv = dteData.emisor.ruc.includes('-') ? dteData.emisor.ruc.split('-')[1] : '5';

    // Datos del documento
    const tipoDoc = (dteData.documento?.tipo || '01').toString().padStart(2, '0');
    const serie = '001'; // Valor por defecto según SIFEN
    const numero = dteData.documento?.numero?.toString().padStart(8, '0') || '00000067';
    const tipoEmision = '1';

    // Fecha en formato YYYYMMDD
    const fecha = new Date(dteData.documento?.fecha || new Date()).toISOString().substring(0, 10).replace(/-/g, '');

    // Total con 10 dígitos según especificaciones SIFEN
    const total = Math.floor(dteData.totales?.total || 25000).toString().padStart(10, '0');

    const cdcBase = `${tipoDoc}${ruc}${dv}${serie}${numero}${tipoEmision}${fecha}${total}`;

    // Agregar hash de 3 dígitos para completar los 44 caracteres del CDC
    const hash = '123'; // Hash dummy por ahora
    const cdcCompleto = cdcBase + hash;

    return cdcCompleto;
  }

  // Función para formatear fecha con hora para SIFEN
  formatearFechaHoraSifen(fecha) {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  // Función para escapar caracteres XML especiales
  escaparXml(texto) {
    if (!texto) return '';
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Función para limpiar valores que deben ser numéricos según XSD
  limpiarValorNumerico(valor, esRuc = false) {
    if (!valor) return '';

    const valorStr = valor.toString();

    let resultado;
    if (esRuc) {
      // Para RUC: si tiene formato XXXXXXXX-X, tomar solo los primeros 8 dígitos
      if (valorStr.includes('-')) {
        resultado = valorStr.split('-')[0].replace(/[^0-9]/g, '');
      } else {
        // Si no tiene guion, tomar los primeros 8 dígitos
        resultado = valorStr.replace(/[^0-9]/g, '').substring(0, 8);
      }
    } else {
      // Para otros valores (teléfonos, etc.): remover todos los caracteres no numéricos
      resultado = valorStr.replace(/[^0-9]/g, '') || '';
    }

    return resultado;
  }

  construirXmlDte(dteData) {
    // Calcular CDC para usar como ID del DE
    const cdcCalculado = this.generarCdcParaXml(dteData);

    // Estructura CORREGIDA según esquema XSD de SIFEN v150
    return `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://ekuatia.set.gov.py/sifen/xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ekuatia.set.gov.py/sifen/xsd siRecepDE_v150.xsd">
  <dVerFor>150</dVerFor>
  <DE Id="${cdcCalculado}">
    <dDVId>1</dDVId>
    <dFecFirma>${this.formatearFechaHoraSifen(new Date())}</dFecFirma>
    <dSisFact>1</dSisFact>
    <gOpeDE>
      <iTipEmi>1</iTipEmi>
      <dDesTipEmi>Normal</dDesTipEmi>
      <dCodSeg>123456789</dCodSeg>
      <dInfoEmi>Emision normal</dInfoEmi>
      <dInfoFisc>Factura electrónica</dInfoFisc>
    </gOpeDE>
    <gTimb>
      <iTiDE>1</iTiDE>
      <dDesTiDE>Factura electrónica</dDesTiDE>
      <dNumTim>12345678</dNumTim>
      <dEst>001</dEst>
      <dPunExp>001</dPunExp>
      <dNumDoc>${(dteData.documento?.numero || 1).toString().padStart(7, '0')}</dNumDoc>
      <dSerieNum>AA</dSerieNum>
      <dFeIniT>2025-01-01</dFeIniT>
    </gTimb>
    <gDatGralOpe>
      <dFeEmiDE>${this.formatearFechaHoraSifen(dteData.documento.fecha)}</dFeEmiDE>
      <gOpeCom>
        <iTipTra>1</iTipTra>
        <dDesTipTra>Venta de mercadería</dDesTipTra>
        <iTImp>1</iTImp>
        <dDesTImp>IVA</dDesTImp>
        <cMoneOpe>PYG</cMoneOpe>
        <dDesMoneOpe>Guarani</dDesMoneOpe>
      </gOpeCom>
      <gEmis>
        <dRucEm>${this.limpiarValorNumerico(dteData.emisor.ruc, true)}</dRucEm>
        <dDVEmi>5</dDVEmi>
        <iTipCont>1</iTipCont>
        <cTipReg>8</cTipReg>
        <dNomEmi>${this.escaparXml(dteData.emisor.razonSocial)}</dNomEmi>
        <dNomFanEmi>${this.escaparXml(dteData.emisor.nombreComercial || dteData.emisor.razonSocial)}</dNomFanEmi>
        <dDirEmi>${this.escaparXml(dteData.emisor.direccion)}</dDirEmi>
        <dNumCas>0</dNumCas>
        <cDepEmi>19</cDepEmi>
        <dDesDepEmi>CANINDEYU</dDesDepEmi>
        <cDisEmi>207</cDisEmi>
        <dDesDisEmi>SALTO DEL GUAIRA</dDesDisEmi>
        <cCiuEmi>4738</cCiuEmi>
        <dDesCiuEmi>SALTO DEL GUAIRA</dDesCiuEmi>
        <dTelEmi>${this.limpiarValorNumerico(dteData.emisor.telefono) || '595211234567'}</dTelEmi>
        <dEmailE>${dteData.emisor.email || 'info@empresa.com.py'}</dEmailE>
        <dDenSuc>${dteData.emisor.razonSocial}</dDenSuc>
        <gActEco>
          <cActEco>47112</cActEco>
          <dDesActEco>Comercio al por menor en mini mercados y despensas</dDesActEco>
        </gActEco>
        <gActEco>
          <cActEco>47190</cActEco>
          <dDesActEco>Comercio al por menor de otros productos en comercios no especializados</dDesActEco>
        </gActEco>
        <gActEco>
          <cActEco>47220</cActEco>
          <dDesActEco>Comercio al por menor de bebidas</dDesActEco>
        </gActEco>
        <gActEco>
          <cActEco>56101</cActEco>
          <dDesActEco>Restaurante y parrilladas</dDesActEco>
        </gActEco>
      </gEmis>
      <gDatRec>
        <iNatRec>1</iNatRec>
        <iTiOpe>1</iTiOpe>
        <cPaisRec>PRY</cPaisRec>
        <dDesPaisRe>Paraguay</dDesPaisRe>
        <iTiContRec>1</iTiContRec>
        <dRucRec>${this.limpiarValorNumerico(dteData.receptor.ruc, true)}</dRucRec>
        <dDVRec>7</dDVRec>
        <iTipIDRec>1</iTipIDRec>
        <dNomRec>${this.escaparXml(dteData.receptor.razonSocial)}</dNomRec>
        <dDirRec>${this.escaparXml(dteData.receptor.direccion)}</dDirRec>
        <dNumCasRec>0</dNumCasRec>
        <cDepRec>19</cDepRec>
        <dDesDepRec>CANINDEYU</dDesDepRec>
        <cCiuRec>4851</cCiuRec>
        <dDesCiuRec>SALTOS DEL GUAIRA</dDesCiuRec>
        <dTelRec>${this.limpiarValorNumerico(dteData.receptor.telefono) || '595211234567'}</dTelRec>
        <dEmailRec>${dteData.receptor.email || 'cliente@email.com'}</dEmailRec>
        <dCodCliente>173</dCodCliente>
      </gDatRec>
    </gDatGralOpe>
    <gDtipDE>
      <gCamFE>
        <iIndPres>1</iIndPres>
        <dDesIndPres>Operación presencial</dDesIndPres>
      </gCamFE>
      <gCamCond>
        <iCondOpe>2</iCondOpe>
        <dDCondOpe>Crédito</dDCondOpe>
        <gPagCred>
          <iCondCred>1</iCondCred>
          <dDCondCred>Plazo</dDCondCred>
          <dPlazoCre>30</dPlazoCre>
        </gPagCred>
      </gCamCond>
      <gCamItem>
        <dCodInt>001</dCodInt>
        <dDesProSer>${this.escaparXml('Producto de prueba')}</dDesProSer>
        <cUniMed>77</cUniMed>
        <dDesUniMed>UNI</dDesUniMed>
        <dCantProSer>1.000</dCantProSer>
        <gValorItem>
          <dPUniProSer>${dteData.totales.total || '25000'}</dPUniProSer>
          <dTotBruOpeItem>${dteData.totales.total || '25000'}</dTotBruOpeItem>
          <gValorRestaItem>
            <dDescItem>0</dDescItem>
            <dPorcDesIt>0.00</dPorcDesIt>
            <dDescGloItem>0.00</dDescGloItem>
            <dAntPreUniIt>0</dAntPreUniIt>
            <dAntGloPreUniIt>0</dAntGloPreUniIt>
            <dTotOpeItem>${dteData.totales.total || '25000'}</dTotOpeItem>
          </gValorRestaItem>
        </gValorItem>
        <gCamIVA>
          <iAfecIVA>1</iAfecIVA>
          <dDesAfecIVA>Gravado IVA</dDesAfecIVA>
          <dPropIVA>100.00</dPropIVA>
          <dTasaIVA>10</dTasaIVA>
          <dBasGravIVA>${Math.round((dteData.totales.total || 25000) * 0.90909)}</dBasGravIVA>
          <dLiqIVAItem>${Math.round((dteData.totales.total || 25000) * 0.09091)}</dLiqIVAItem>
          <dBasExe>0</dBasExe>
        </gCamIVA>
      </gCamItem>
      <gCamEsp>
        <gGrupSup>
          <dNomCaj>CAMION1</dNomCaj>
        </gGrupSup>
      </gCamEsp>
    </gDtipDE>
    <gTotSub>
      <dSubExe>0</dSubExe>
      <dSubExo>0</dSubExo>
      <dSub5>0</dSub5>
      <dSub10>${dteData.totales.total || '25000'}</dSub10>
      <dTotOpe>${dteData.totales.total || '25000'}</dTotOpe>
      <dTotDesc>0.000</dTotDesc>
      <dTotDescGlotem>0.00</dTotDescGlotem>
      <dTotAntItem>0</dTotAntItem>
      <dTotAnt>0</dTotAnt>
      <dPorcDescTotal>0.00</dPorcDescTotal>
      <dDescTotal>0.000</dDescTotal>
      <dAnticipo>0</dAnticipo>
      <dRedon>0</dRedon>
      <dComi>0</dComi>
      <dTotGralOpe>${dteData.totales.total || '25000'}</dTotGralOpe>
      <dIVA5>0</dIVA5>
      <dIVA10>${Math.round((dteData.totales.total || 25000) * 0.09091)}</dIVA10>
      <dLiqTotIVA5>0</dLiqTotIVA5>
      <dLiqTotIVA10>0</dLiqTotIVA10>
      <dIVAComi>0</dIVAComi>
      <dTotIVA>${Math.round((dteData.totales.total || 25000) * 0.09091)}</dTotIVA>
      <dBaseGrav5>0</dBaseGrav5>
      <dBaseGrav10>${Math.round((dteData.totales.total || 25000) * 0.90909)}</dBaseGrav10>
      <dTBasGraIVA>${Math.round((dteData.totales.total || 25000) * 0.90909)}</dTBasGraIVA>
    </gTotSub>
    <gCamGen>
      <dOrdCompra>0</dOrdCompra>
    </gCamGen>
  </DE>
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <ds:Reference URI="#${cdcCalculado}">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>dummy_digest_value_for_testing</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>dummy_signature_value_for_testing</ds:SignatureValue>
    <ds:KeyInfo>
      <ds:X509Data>
        <ds:X509Certificate>dummy_certificate_for_testing</ds:X509Certificate>
      </ds:X509Data>
    </ds:KeyInfo>
  </ds:Signature>
  <gCamFuFD>
    <dCarQR>${cdcCalculado}</dCarQR>
    <dInfAdic>${this.escaparXml('Factura electrónica generada por sistema')}</dInfAdic>
  </gCamFuFD>
  <dProtAut>000000</dProtAut>
  <xContEv/>
</rDE>`;
  }

  construirItemXml(item) {
    return `<gCamItem>
      <dCodInt>${item.codigo}</dCodInt>
      <dDesProSer>${item.descripcion}</dDesProSer>
      <dCantProSer>${item.cantidad}</dCantProSer>
      <cUniMed>21</cUniMed>
      <dDesUniMed>Unidad</dDesUniMed>
      <dPUniProSer>${item.precioUnitario}</dPUniProSer>
      <dTotBruOpeItem>${item.total}</dTotBruOpeItem>
      <gValorItem>
        <dPUniProSer>${item.precioUnitario}</dPUniProSer>
        <dTasaIVA>${this.obtenerTasaIva(item.iva)}</dTasaIVA>
      </gValorItem>
    </gCamItem>`;
  }

  obtenerTasaIva(iva) {
    if (iva === 5) return '5';
    if (iva === 10) return '10';
    return '0';
  }

  formatearFechaSifen(fecha) {
    return moment(fecha).format('YYYY-MM-DD');
  }

  formatearHoraSifen(fecha) {
    return moment(fecha).format('HH:mm:ss');
  }

  /**
   * Construye XML DTE y lo valida contra esquema XSD
   * @param {Object} dteData - Datos del DTE
   * @param {boolean} validar - Si debe validar contra XSD (default: true)
   * @returns {Object} Resultado con XML y validación
   */
  construirXmlDteValidado(dteData, validar = true) {
    try {
      // Construir XML base
      const xmlContent = this.construirXmlDte(dteData);

      if (!validar) {
        return {
          xml: xmlContent,
          validacion: {
            valido: true,
            mensaje: 'Validación omitida',
            errores: [],
            advertencias: []
          }
        };
      }

      // Validar contra esquema XSD
      const resultadoValidacion = xmlValidator.validarXml(xmlContent);

      return {
        xml: xmlContent,
        validacion: resultadoValidacion
      };
    } catch (error) {
      return {
        xml: '',
        validacion: {
          valido: false,
          mensaje: `Error al construir XML: ${error.message}`,
          errores: [error.message],
          advertencias: []
        }
      };
    }
  }

  /**
   * Construye XML DTE y valida estrictamente (lanza error si inválido)
   * @param {Object} dteData - Datos del DTE
   * @returns {string} XML validado
   * @throws {Error} Si el XML no es válido
   */
  construirXmlDteEstricto(dteData) {
    const resultado = this.construirXmlDteValidado(dteData, true);

    if (!resultado.validacion.valido) {
      const errorMsg = `XML inválido contra esquema SIFEN: ${resultado.validacion.mensaje}`;
      throw new Error(errorMsg);
    }

    return resultado.xml;
  }

  formatearHoraSifen(fecha) {
    return moment(fecha).format('HH:mm:ss');
  }

}

module.exports = XmlBuilder;
