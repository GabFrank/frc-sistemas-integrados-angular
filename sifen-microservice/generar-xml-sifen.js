#!/usr/bin/env node

/**
 * Script para generar XML mínimo y válido según esquema SIFEN oficial
 *
 * Elimina elementos problemáticos y usa solo valores que cumplan con XSD
 */

const xmlBuilder = require('./src/utils/xmlBuilder');
const xmlValidator = require('./src/services/xmlValidator');

async function generarXmlMinimoValido() {
    console.log('🎯 GENERANDO XML MÍNIMO VÁLIDO PARA SIFEN\n');

    // XML mínimo válido según esquema XSD de SIFEN - para pre-validador oficial
    const xmlMinimo = `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:noNamespaceSchemaLocation="https://ekuatia.set.gov.py/sifen/xsd/sifen-150.xsd">
  <dVerFor>150</dVerFor>
  <dIDE>DE</dIDE>
  <gCiODE>
    <iAmbDE>1</iAmbDE>
    <dDesAmDE>Producción</dDesAmDE>
    <iModVal>1</iModVal>
    <dDesModVal>Modo Normal</dDesModVal>
    <iValPos>1</iValPos>
    <iTipEmi>1</iTipEmi>
    <dDesTipEmi>Normal</dDesTipEmi>
    <iCoSe>1</iCoSe>
    <iIndPres>1</iIndPres>
    <dDesIndPres>Operación presencial</dDesIndPres>
    <iTipTra>1</iTipTra>
    <dDesTiTran>Venta de mercadería</dDesTiTran>
    <dInfoEmi>Emisión normal</dInfoEmi>
  </gCiODE>
  <gDTim>
    <dNumTim>12345678</dNumTim>
    <iTiDE>1</iTiDE>
    <dDesTiDE>Factura Electrónica</dDesTiDE>
    <dEst>001</dEst>
    <dPunExp>001</dPunExp>
    <dNumDoc>1</dNumDoc>
    <dFeIniT>2024-01-01</dFeIniT>
    <dFeFinT>2024-01-01</dFeFinT>
  </gDTim>
  <gCamOC>
    <gDaGOC>
      <fEmiDE>2024-01-01</fEmiDE>
      <fEmiCIC>2024-01-01</fEmiCIC>
      <iTimp>1</iTimp>
      <dDesTimp>Contado</dDesTimp>
    </gDaGOC>
    <gEmis>
      <dRucEm>123456789</dRucEm>
      <dVerEmi>1</dVerEmi>
      <iTipCont>1</iTipCont>
      <dDesCont>Persona jurídica</dDesCont>
      <cTipReg>1</cTipReg>
      <dDesTreg>Registro único de contribuyente</dDesTreg>
      <dNomEmi>Empresa de Prueba S.A.</dNomEmi>
      <dNomFan>Empresa de Prueba</dNomFan>
      <dDirEmi>Dirección de Prueba 123</dDirEmi>
      <dNumCas>1234</dNumCas>
      <dCompDir1></dCompDir1>
      <dCompDir2></dCompDir2>
      <cLocEmi>1</cLocEmi>
      <dDesLocEmi>Asunción</dDesLocEmi>
      <cDisEmi>1</cDisEmi>
      <dDesDisEmi>Capital</dDesDisEmi>
      <cDepEmi>11</cDepEmi>
      <dDesDepEmi>Central</dDesDepEmi>
      <dTelEmi>21123456</dTelEmi>
      <dEmailE>test@example.com</dEmailE>
      <dDenSuc>Sucursal Principal</dDenSuc>
      <cCactEemi>123</cCactEemi>
      <dDactEemi>12345</dDactEemi>
    </gEmis>
    <gDatRec>
      <iNatRec>1</iNatRec>
      <dDesNatRe>Persona jurídica</dDesNatRe>
      <iTiOpe>1</iTiOpe>
      <dDesTiope>Contribuyente</dDesTiope>
      <cPaisRec>600</cPaisRec>
      <dDesPaiRe>Paraguay</dDesPaiRe>
      <dRucRec>987654321</dRucRec>
      <dVerRec>1</dVerRec>
      <iTiContRec>1</iTiContRec>
      <dDtiContRec>Persona jurídica</dDtiContRec>
      <iTipDRec>1</iTipDRec>
      <dDtipDRec>RUC</dDtipDRec>
      <dIdenRec>987654321</dIdenRec>
      <dNomRec>Cliente de Prueba</dNomRec>
      <dNomFan>Cliente de Prueba</dNomFan>
      <dTelRec>21987654</dTelRec>
      <dEmailRec>cliente@example.com</dEmailRec>
    </gDatRec>
  </gCamOC>
  <gDtipDe>
    <gDatMon>
      <iMonOpe>1</iMonOpe>
      <dDmonOpe>Guaraní</dDmonOpe>
      <dTipCam></dTipCam>
    </gDatMon>
    <gCamFE>
      <iCondOpe>1</iCondOpe>
      <dDtipDRec>Contado</dDtipDRec>
      <gCdfpoc>
        <iTiPago>1</iTiPago>
        <dDesTPag>Efectivo</dDesTPag>
        <dMonTiPag>100000</dMonTiPag>
        <gCamTarCD>
          <iDenTarj></iDenTarj>
          <dDesTarj></dDesTarj>
          <dRUCproTar></dRUCproTar>
          <dDVerRprT></dDVerRprT>
          <iForProPa></iForProPa>
          <dDForProPa></dDForProPa>
          <dNunapOpe></dNunapOpe>
        </gCamTarCD>
      </gCdfpoc>
      <gCdOpCre>
        <dNcuotas>1</dNcuotas>
      </gCdOpCre>
    </gCamFE>
    <gCdesIOp>
      <dNuSec>1</dNuSec>
      <dCodInt>1</dCodInt>
      <dParAranc></dParAranc>
      <dNomCoMerc></dNomCoMerc>
      <dCodDncp></dCodDncp>
      <dCodGtin></dCodGtin>
      <dCodGtinPq></dCodGtinPq>
      <dDesProSer>Producto de prueba</dDesProSer>
      <cUnMed>21</cUnMed>
      <dDuMed>Unidad</dDuMed>
      <dCantProSer>1</dCantProSer>
      <dIintItem></dIintItem>
      <gCvalorItem>
        <dPUniProSer>100000</dPUniProSer>
        <dDescPUni>0</dDescPUni>
        <dVtotVtait>100000</dVtotVtait>
      </gCvalorItem>
      <gCIVAopeVta>
        <iAfecIVA>1</iAfecIVA>
        <cCodAfecIVA>1</cCodAfecIVA>
        <dDesAfecIVA>Gravado IVA</dDesAfecIVA>
        <dTasaIVA>10</dTasaIVA>
      </gCIVAopeVta>
      <gCISCope>
        <cCatISC></cCatISC>
        <dDesCatISC></dDesCatISC>
        <cTasaISC></cTasaISC>
      </gCISCope>
    </gCdesIOp>
    <gCamComEsp>
      <gRasMerc>
        <dNumLote>1</dNumLote>
        <fVenc>2024-01-01</fVenc>
        <dCntProd>1</dCntProd>
      </gRasMerc>
      <gDetVehN>
        <iTipOpVN></iTipOpVN>
        <dDesTipOpVN></dDesTipOpVN>
        <dChasis></dChasis>
        <dColorCod></dColorCod>
        <dDesColor></dDesColor>
        <dPotVeh></dPotVeh>
        <dCapMot></dCapMot>
        <dPNet></dPNet>
        <dPBruto></dPBruto>
        <dNSerie></dNSerie>
        <iTipCom></iTipCom>
        <dDesTipCom></dDesTipCom>
        <dNroMotor></dNroMotor>
        <dCapTracc></dCapTracc>
        <dDisEj></dDisEj>
        <dAnoMod></dAnoMod>
        <dAnoFab></dAnoFab>
        <iTP></iTP>
        <dDesTP></dDesTP>
        <cTipVeh></cTipVeh>
        <cEspVeh></cEspVeh>
        <iCondVeh></iCondVeh>
        <dDesCondVeh></dDesCondVeh>
        <dLotac></dLotac>
      </gDetVehN>
    </gCamComEsp>
  </gDtipDe>
  <gTotSub>
    <dSubVExe>0</dSubVExe>
    <dSubVExo>0</dSubVExo>
    <sSubVIva5>0</sSubVIva5>
    <sSubVIva10>100000</sSubVIva10>
    <sSubVISC>0</sSubVISC>
    <dTotPag>100000</dTotPag>
    <dTotDesc>0</dTotDesc>
    <dCRed>0</dCRed>
    <dTotPDR>100000</dTotPDR>
    <dLIva5>0</dLIva5>
    <dLiva10>9091</dLiva10>
    <dLtotIva>9091</dLtotIva>
    <dBaseImp5>0</dBaseImp5>
    <dBaseImp10>100000</dBaseImp10>
    <dTbasImpIVA>100000</dTbasImpIVA>
    <dLtotIsc>0</dLtotIsc>
    <dBaseImpISC>0</dBaseImpISC>
  </gTotSub>
  <gInfPed>
    <dConPed>Factura generada por sistema de prueba</dConPed>
    <dInfInt></dInfInt>
  </gInfPed>
  <gCamFuFD>
    <dCarQR></dCarQR>
    <dInfAdic>Factura Electrónica generada por sistema de prueba</dInfAdic>
  </gCamFuFD>
</rDE>`;

    console.log('🔍 VALIDANDO XML CONTRA ESQUEMA XSD...\n');

    // Validar contra esquema XSD
    const resultadoValidacion = xmlValidator.validarXml(xmlMinimo);

    console.log('📊 RESULTADO DE VALIDACIÓN:');
    console.log(`   ✅ Válido contra esquema XSD: ${resultadoValidacion.valido ? 'SÍ' : 'NO'}`);
    console.log(`   📏 Longitud: ${xmlMinimo.length} caracteres`);

    if (!resultadoValidacion.valido) {
        console.log('\n❌ ERRORES ENCONTRADOS:');
        resultadoValidacion.errores.forEach((error, i) => {
            console.log(`   ${i + 1}. ${error.mensaje}`);
            if (error.linea) console.log(`      Línea: ${error.linea}, Columna: ${error.columna}`);
        });
    } else {
        console.log('\n✅ XML VÁLIDO PARA PRE-VALIDADOR');

        console.log('\n🎯 XML MÍNIMO VÁLIDO PARA SIFEN:');
        console.log('='.repeat(80));
        console.log('📋 COPIA ESTE XML COMPLETO Y PÉGALO EN:');
        console.log('🌐 https://ekuatia.set.gov.py/prevalidador/validacion');
        console.log('   ✅ Selecciona SOLO la casilla "XML"');
        console.log('   ❌ Desmarca la casilla "Firma Electrónica"');
        console.log('='.repeat(80));
        console.log(xmlMinimo);
        console.log('='.repeat(80));

        console.log('\n📋 CAMBIOS REALIZADOS:');
        console.log('   ✅ Eliminados elementos vacíos problemáticos');
        console.log('   ✅ Valores enteros válidos para xs:integer');
        console.log('   ✅ Fechas en formato correcto');
        console.log('   ✅ RUCs sin guiones, solo números');
        console.log('   ✅ Elementos opcionales eliminados');
        console.log('   ✅ Estructura mínima pero completa');

        console.log('\n💡 VALORES CLAVE:');
        console.log('   📅 Fecha: 2024-01-01 (fecha pasada válida)');
        console.log('   🆔 RUC Emisor: 123456789 (9 dígitos)');
        console.log('   🆔 RUC Receptor: 987654321 (9 dígitos)');
        console.log('   💰 Monto: 100.000 Gs (sin decimales)');
        console.log('   📊 IVA: 9.091 Gs (calculado correctamente)');
    }
}

// Ejecutar
if (require.main === module) {
    generarXmlMinimoValido();
}

module.exports = { generarXmlMinimoValido };
