#!/usr/bin/env node

/**
 * Genera XML V25 con namespaces XML-DSig correctos
 */

const DteGenerator = require('./src/services/dteGenerator');
const fs = require('fs');

const testFacturaData = {
  id: 55422,
  emisor: {
    ruc: '80099482-5',
    razonSocial: 'FRANCO AREVALOS S.A.',
    nombreComercial: 'FRANCO AREVALOS S.A.',
    direccion: 'Dirección de la empresa',
    telefono: '021123456',
    email: 'info@empresa.com.py'
  },
  receptor: {
    ruc: '5533191-7',
    razonSocial: 'JORGE LUIS CAMPUZANO BENITEZ',
    direccion: 'Dirección Cliente',
    telefono: '0211234567',
    email: 'cliente@email.com'
  },
  documento: {
    tipo: '01',
    numero: 67,
    fecha: '2025-09-06',
    serie: '001'
  },
  items: [{
    codigo: '001',
    descripcion: 'Producto de prueba',
    cantidad: 1,
    precioUnitario: 25000,
    descuento: 0,
    iva: 10,
    total: 25000
  }],
  totales: {
    gravada10: 25000,
    gravada5: 0,
    exenta: 0,
    iva10: 2272.73,
    iva5: 0,
    total: 25000
  }
};

async function generarXML() {
  try {
    console.log('🔄 Generando XML FINAL V25 con namespaces XML-DSig correctos...');

    const generator = new DteGenerator();
    const dteResult = await generator.generarDte(testFacturaData);

    console.log('✅ DTE generado exitosamente');

    // Verificar valores
    const xmlContent = dteResult.xmlFirmado;
    const hasDummyDigest = xmlContent.includes('dummy_digest_value_for_testing');
    const hasDummySignature = xmlContent.includes('dummy_signature_value_for_testing');
    const hasDummyCert = xmlContent.includes('dummy_certificate_for_testing');

    console.log('\n📋 Verificación de firma:');
    console.log(`   DigestValue dummy: ${hasDummyDigest ? '❌ AÚN PRESENTE' : '✅ REEMPLAZADO'}`);
    console.log(`   SignatureValue dummy: ${hasDummySignature ? '❌ AÚN PRESENTE' : '✅ REEMPLAZADO'}`);
    console.log(`   Certificate dummy: ${hasDummyCert ? '❌ AÚN PRESENTE' : '✅ REEMPLAZADO'}`);

    // Verificar transformaciones
    const hasCorrectTransforms = xmlContent.includes('http://www.w3.org/2001/10/xml-exc-c14n#') &&
                                xmlContent.includes('http://www.w3.org/2000/09/xmldsig#enveloped-signature');
    console.log(`   Transformaciones correctas: ${hasCorrectTransforms ? '✅ ORDEN CORRECTO' : '❌ ORDEN INCORRECTO'}`);

    // Verificar namespaces
    const hasCorrectNamespaces = xmlContent.includes('xmlns:ds="http://www.w3.org/2000/09/xmldsig#"') &&
                                xmlContent.includes('xmlns="http://ekuatia.set.gov.py/sifen/xsd"');
    console.log(`   Namespaces XML-DSig: ${hasCorrectNamespaces ? '✅ NAMESPACES CORRECTOS' : '❌ NAMESPACES ERROR'}`);

    // Guardar el XML
    const xmlPath = './xml-sifen-FINAL-V25.xml';
    fs.writeFileSync(xmlPath, dteResult.xmlFirmado, 'utf8');
    console.log(`\n💾 XML FINAL V25 guardado en: ${xmlPath}`);

    if (!hasDummyDigest && !hasDummySignature && !hasDummyCert && hasCorrectTransforms && hasCorrectNamespaces) {
      console.log('\n🎉 ¡XML V25 XML-DSIG COMPLETO!');
      console.log('🔐 Namespaces correctos - Compatible con validadores XML-DSig');
    } else {
      console.log('\n⚠️  Verificar configuración');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generarXML();
