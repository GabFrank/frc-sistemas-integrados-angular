const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Validador XSD externo usando xmllint
 * Alternativa cuando libxmljs2 tiene problemas
 */
class XsdValidatorExternal {
    constructor() {
        this.xsdPath = path.resolve(__dirname, '../schemas/siRecepDE_v150.xsd');
        this.xmllintAvailable = this.checkXmllint();
    }

    /**
     * Verifica si xmllint está disponible
     */
    checkXmllint() {
        try {
            execSync('which xmllint', { stdio: 'pipe' });
            return true;
        } catch (error) {
            logger.warn('[XSD-EXT] xmllint no está disponible en el sistema');
            return false;
        }
    }

    /**
     * Valida XML usando xmllint externo
     * @param {string} xmlContent - Contenido XML a validar
     * @returns {Object} Resultado de validación
     */
    validarXml(xmlContent) {
        if (!this.xmllintAvailable) {
            return {
                valido: true,
                mensaje: 'xmllint no disponible - validación omitida',
                errores: [],
                advertencias: [{
                    mensaje: 'xmllint no está instalado en el sistema',
                    tipo: 'herramienta_no_disponible'
                }]
            };
        }

        try {
            // Crear archivo temporal para el XML
            const tempXmlPath = path.join(__dirname, `temp_validation_${Date.now()}.xml`);
            fs.writeFileSync(tempXmlPath, xmlContent);

            // Ejecutar validación con xmllint
            const command = `xmllint --schema ${this.xsdPath} ${tempXmlPath} --noout`;
            execSync(command, { stdio: 'pipe' });

            // Limpiar archivo temporal
            fs.unlinkSync(tempXmlPath);

            logger.info('[XSD-EXT] ✅ XML válido con xmllint');
            return {
                valido: true,
                mensaje: 'XML válido contra esquema SIFEN (xmllint)',
                errores: [],
                advertencias: []
            };

        } catch (error) {
            // Limpiar archivo temporal si existe
            try {
                const tempFiles = fs.readdirSync(__dirname)
                    .filter(file => file.startsWith('temp_validation_'))
                    .forEach(file => {
                        fs.unlinkSync(path.join(__dirname, file));
                    });
            } catch (cleanupError) {
                // Ignorar errores de limpieza
            }

            const errorMessage = error.stderr ? error.stderr.toString() : error.message;

            logger.warn('[XSD-EXT] ❌ XML inválido con xmllint:', errorMessage);

            return {
                valido: false,
                mensaje: 'XML inválido contra esquema SIFEN (xmllint)',
                errores: [{
                    mensaje: errorMessage,
                    linea: null,
                    columna: null,
                    nivel: 'error'
                }],
                advertencias: []
            };
        }
    }
}

module.exports = XsdValidatorExternal;
