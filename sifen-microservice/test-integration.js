#!/usr/bin/env node

/**
 * Script de prueba para verificar la integración entre el microservicio y el backend Java
 * 
 * Uso: node test-integration.js
 */

const axios = require('axios');

// Configuración
const config = {
  microservice: 'http://localhost:3001',
  backend: 'http://localhost:8081',
  testFacturaId: 1,
  testSucursalId: 1
};

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testBackendHealth() {
  logInfo('🔍 Probando salud del backend Java...');
  
  try {
    const response = await axios.get(`${config.backend}/api/sifen/test`, { timeout: 5000 });
    
    if (response.status === 200) {
      logSuccess('Backend Java respondiendo correctamente');
      log(`   Status: ${response.data.status}`, 'green');
      log(`   Mensaje: ${response.data.message}`, 'green');
      return true;
    } else {
      logError(`Backend Java respondió con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error conectando al backend Java: ${error.message}`);
    return false;
  }
}

async function testMicroserviceHealth() {
  logInfo('🔍 Probando salud del microservicio Node.js...');
  
  try {
    const response = await axios.get(`${config.microservice}/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      logSuccess('Microservicio Node.js respondiendo correctamente');
      log(`   Status: ${response.data.status}`, 'green');
      log(`   Backend configurado: ${response.data.backend}`, 'green');
      return true;
    } else {
      logError(`Microservicio respondió con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Error conectando al microservicio: ${error.message}`);
    return false;
  }
}

async function testFacturaConsulta() {
  logInfo(`🔍 Probando consulta de factura (ID: ${config.testFacturaId}, Sucursal: ${config.testSucursalId})...`);
  
  try {
    const response = await axios.get(
      `${config.backend}/api/sifen/factura/${config.testFacturaId}/sucursal/${config.testSucursalId}`,
      { timeout: 10000 }
    );
    
    if (response.status === 200) {
      logSuccess('Consulta de factura exitosa');
      log(`   Emisor RUC: ${response.data.emisor?.ruc || 'N/A'}`, 'green');
      log(`   Receptor RUC: ${response.data.receptor?.ruc || 'N/A'}`, 'green');
      log(`   Items: ${response.data.items?.length || 0}`, 'green');
      log(`   Total: ${response.data.totales?.total || 'N/A'}`, 'green');
      return true;
    } else {
      logError(`Consulta de factura respondió con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logWarning('Factura no encontrada (esto es normal si no existe)');
      return true; // No es un error crítico
    } else {
      logError(`Error consultando factura: ${error.message}`);
      return false;
    }
  }
}

async function testDteGeneration() {
  logInfo('🔍 Probando generación de DTE...');
  
  try {
    const response = await axios.post(
      `${config.microservice}/api/documento/generar`,
      {
        facturaId: config.testFacturaId,
        sucursalId: config.testSucursalId
      },
      { timeout: 15000 }
    );
    
    if (response.status === 200) {
      logSuccess('Generación de DTE exitosa');
      log(`   CDC: ${response.data.dte?.cdc || 'N/A'}`, 'green');
      log(`   QR URL: ${response.data.dte?.qrUrl || 'N/A'}`, 'green');
      log(`   Estado: ${response.data.dte?.estado || 'N/A'}`, 'green');
      return true;
    } else {
      logError(`Generación de DTE respondió con status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logWarning('Factura no encontrada en el backend (esto es normal si no existe)');
      return true; // No es un error crítico
    } else {
      logError(`Error generando DTE: ${error.message}`);
      return false;
    }
  }
}

async function runAllTests() {
  log('🚀 Iniciando pruebas de integración...', 'bright');
  log('=' * 50, 'cyan');
  
  const results = [];
  
  // Test 1: Backend Java
  results.push(await testBackendHealth());
  
  // Test 2: Microservicio Node.js
  results.push(await testMicroserviceHealth());
  
  // Test 3: Consulta de factura
  results.push(await testFacturaConsulta());
  
  // Test 4: Generación de DTE
  results.push(await testDteGeneration());
  
  // Resumen
  log('=' * 50, 'cyan');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    logSuccess(`🎉 Todas las pruebas pasaron (${passed}/${total})`);
  } else {
    logError(`⚠️  Algunas pruebas fallaron (${passed}/${total})`);
  }
  
  log('=' * 50, 'cyan');
  log('📋 Resumen de resultados:', 'bright');
  
  const testNames = [
    'Backend Java',
    'Microservicio Node.js', 
    'Consulta de factura',
    'Generación de DTE'
  ];
  
  testNames.forEach((name, index) => {
    const status = results[index] ? '✅ PASÓ' : '❌ FALLÓ';
    const color = results[index] ? 'green' : 'red';
    log(`   ${name}: ${status}`, color);
  });
  
  log('=' * 50, 'cyan');
}

// Ejecutar pruebas
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Error ejecutando pruebas: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testBackendHealth,
  testMicroserviceHealth,
  testFacturaConsulta,
  testDteGeneration,
  runAllTests
};
