const https = require('https');
const fs = require('fs');
const config = require('./src/config/config');

console.log('=== VERIFICACIÓN DE CERTIFICADO SIFEN ===\n');

// Verificar configuración
console.log('📋 Configuración del certificado:');
console.log(`   Ruta: ${config.certificates.path}`);
console.log(`   Contraseña: ${config.certificates.password ? 'Configurada' : 'NO CONFIGURADA'}\n`);

// Verificar si existe el archivo
if (fs.existsSync(config.certificates.path)) {
    console.log('✅ Archivo del certificado encontrado');

    try {
        const stats = fs.statSync(config.certificates.path);
        console.log(`   Tamaño: ${stats.size} bytes`);
        console.log(`   Modificado: ${stats.mtime}\n`);

        // Intentar crear agente HTTPS
        const pfxBuffer = fs.readFileSync(config.certificates.path);
        const httpsAgent = new https.Agent({
            pfx: pfxBuffer,
            passphrase: config.certificates.password,
            rejectUnauthorized: false
        });

        console.log('✅ Certificado válido y agente HTTPS creado correctamente');

    } catch (error) {
        console.log('❌ Error al procesar el certificado:');
        console.log(`   ${error.message}\n`);
    }

} else {
    console.log('❌ Archivo del certificado NO encontrado');
    console.log('   El archivo debe estar en:', config.certificates.path);
    console.log('   Asegúrese de que el archivo .pfx esté en la ubicación correcta\n');
}

console.log('=== ACCIONES RECOMENDADAS ===');
console.log('1. Verificar que el archivo .pfx esté en la ruta correcta');
console.log('2. Verificar que la contraseña del certificado sea correcta');
console.log('3. Si no tiene el certificado, contactar a la DNIT para obtenerlo');
console.log('4. Verificar que el certificado no haya expirado');
console.log('\n=== FIN DE VERIFICACIÓN ===');
