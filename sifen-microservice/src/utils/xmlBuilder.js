const moment = require('moment');

class XmlBuilder {
  construirXmlDte(dteData) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rDE version="1.0">
  <dTE version="1.0">
    <gDtipDE>
      <dTipo>${dteData.documento.tipo}</dTipo>
      <dRucEm>${dteData.emisor.ruc}</dRucEm>
      <dDVEmi>${dteData.emisor.dv || '0'}</dDVEmi>
      <dEst>${dteData.emisor.establecimiento || '001'}</dEst>
      <dPunExp>${dteData.emisor.puntoExpedicion || '001'}</dPunExp>
      <dNumDoc>${dteData.documento.numero}</dNumDoc>
      <dSerieNum>${dteData.documento.serie || '001'}</dSerieNum>
      <dFecEmi>${this.formatearFechaSifen(dteData.documento.fecha)}</dFecEmi>
      <dHorEmi>${this.formatearHoraSifen(dteData.documento.fecha)}</dHorEmi>
      <dFecIni>${this.formatearFechaSifen(dteData.documento.fechaInicio || dteData.documento.fecha)}</dFecIni>
      <dFecFin>${this.formatearFechaSifen(dteData.documento.fechaFin || dteData.documento.fecha)}</dFecFin>
      <dMoneda>${dteData.documento.moneda || 'PYG'}</dMoneda>
      <dTipoCambio>${dteData.documento.tipoCambio || '1'}</dTipoCambio>
      <dCondOper>${dteData.documento.condicionOperacion || '1'}</dCondOper>
      <dPlaOpe>${dteData.documento.plazo || '0'}</dPlaOpe>
    </gDtipDE>
    
    <gDatGralOpe>
      <gOpeCom>
        <iTipTra>1</iTipTra>
        <dDesTipTra>Venta de mercadería</dDesTipTra>
        <dCodSeg>1</dCodSeg>
        <dFecIniTra>${this.formatearFechaSifen(dteData.documento.fecha)}</dFecIniTra>
        <dFecFinTra>${this.formatearFechaSifen(dteData.documento.fecha)}</dFecFinTra>
      </gOpeCom>
    </gDatGralOpe>
    
    <gDatRec>
      <dCodIntRec>${dteData.receptor.ruc}</dCodIntRec>
      <dTidRec>1</dTidRec>
      <dNomRec>${dteData.receptor.razonSocial}</dNomRec>
      <dDirRec>${dteData.receptor.direccion || ''}</dDirRec>
      <dTelRec>${dteData.receptor.telefono || ''}</dTelRec>
      <dEmailRec>${dteData.receptor.email || ''}</dEmailRec>
    </gDatRec>
    
    <gTotSub>
      <dSubExe>${dteData.totales.exenta || '0'}</dSubExe>
      <dSub5>${dteData.totales.gravada5 || '0'}</dSub5>
      <dSub10>${dteData.totales.gravada10 || '0'}</dSub10>
      <dSubIVA5>${dteData.totales.iva5 || '0'}</dSubIVA5>
      <dSubIVA10>${dteData.totales.iva10 || '0'}</dSubIVA10>
      <dTotGral>${dteData.totales.total}</dTotGral>
    </gTotSub>
    
    <gCamItem>
      ${dteData.items.map(item => this.construirItemXml(item)).join('\n      ')}
    </gCamItem>
  </dTE>
</rDE>`;
  }

  construirItemXml(item) {
    return `<gCamItem>
        <dCodInt>${item.codigo}</dCodInt>
        <dDesProSer>${item.descripcion}</dDesProSer>
        <dCantProSer>${item.cantidad}</dCantProSer>
        <dPUniProSer>${item.precioUnitario}</dPUniProSer>
        <dTotBruOpeItem>${item.total}</dTotBruOpeItem>
        <gValorItem>
          <dValUniIt>${item.precioUnitario}</dValUniIt>
          <dTasaIVA>${this.obtenerTasaIva(item.iva)}</dTasaIVA>
          <dPropVal>1</dPropVal>
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
}

module.exports = new XmlBuilder();
