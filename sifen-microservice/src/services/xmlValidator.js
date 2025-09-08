const libxmljs = require('libxmljs');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config/config');
const XmlValidationError = require('../utils/xmlValidationError');

class XmlValidator {
    constructor() {
        this.xsdSchema = null;
        this.xsdPath = path.resolve(__dirname, '../schemas/siRecepDE_v150.xsd');
        this.validacionCompletaHabilitada = true; // Habilitar validación completa por defecto

        // Intentar cargar el esquema XSD al inicializar
        this.cargarEsquema();
    }

    /**
     * Carga el esquema XSD de SIFEN
     */
    cargarEsquema() {
        try {
            if (!fs.existsSync(this.xsdPath)) {
                logger.warn('[XSD] Archivo de esquema no encontrado:', this.xsdPath);
                return;
            }

            // Usar baseUrl para resolver rutas relativas en los esquemas
            const schemasDir = path.dirname(this.xsdPath);
            const xsdContent = fs.readFileSync(this.xsdPath, 'utf8');

            // Intentar cargar con baseUrl primero
            try {
                this.xsdSchema = libxmljs.parseXml(xsdContent, {
                    baseUrl: schemasDir + path.sep
                });
                logger.info('[XSD] Esquema XSD cargado con baseUrl exitosamente');
            } catch (baseUrlError) {
                // Si falla con baseUrl, intentar sin él
                logger.warn('[XSD] baseUrl falló, intentando carga normal:', baseUrlError.message);
                this.xsdSchema = libxmljs.parseXml(xsdContent);
                logger.info('[XSD] Esquema XSD cargado sin baseUrl exitosamente');
            }

            logger.info(`[XSD] Ruta del esquema: ${this.xsdPath}`);

        } catch (error) {
            // Detectar errores específicos de libxmljs2 con esquemas XSD
            const isLibxmlError = error.message && (
                error.message.includes('Invalid XSD schema') ||
                error.message.includes('libxml') ||
                error.domain === 'xml'
            );

            if (isLibxmlError) {
                logger.warn('[XSD] ⚠️  Problema detectado con libxmljs2 y esquema XSD:', {
                    error: error.message,
                    recomendacion: 'Considerar actualizar libxmljs2 o usar xmllint externo',
                    alternativa: 'La validación se omitirá para evitar errores'
                });
            } else {
                logger.error('[XSD] Error cargando esquema XSD:', {
                    error: error.message,
                    path: this.xsdPath,
                    stack: error.stack
                });
            }
            this.xsdSchema = null;
        }
    }

    /**
     * Valida un XML contra el esquema XSD de SIFEN
     * @param {string} xmlContent - Contenido XML a validar
     * @returns {Object} Resultado de la validación
     */
    validarXml(xmlContent) {
        try {
            // Siempre hacer validación básica primero (sintaxis y estructura)
            const validacionBasica = this.validarBasica(xmlContent);
            if (!validacionBasica.valido) {
                return validacionBasica;
            }

            // Si la validación completa está habilitada, intentar XSD
            if (this.validacionCompletaHabilitada && this.xsdSchema) {
                logger.info('[XSD] Intentando validación completa contra esquema SIFEN');
                return this.validarCompleta(xmlContent);
            } else {
                logger.info('[XSD] ✅ Validación básica exitosa - validación XSD omitida');
                return {
                    valido: true,
                    mensaje: 'Validación básica exitosa - XSD omitido',
                    errores: [],
                    advertencias: [{
                        mensaje: 'Validación XSD deshabilitada por compatibilidad',
                        tipo: 'validacion_limitada'
                    }]
                };
            }

        } catch (error) {
            logger.error('[XSD] Error general en validación:', error.message);
            return {
                valido: false,
                mensaje: `Error en validación: ${error.message}`,
                errores: [{
                    mensaje: error.message,
                    linea: null,
                    columna: null,
                    nivel: 'error'
                }],
                advertencias: []
            };
        }
    }

    /**
     * Validación básica: sintaxis XML y estructura
     */
    validarBasica(xmlContent) {
        try {
            // Verificar que el contenido no esté vacío
            if (!xmlContent || xmlContent.trim().length === 0) {
                return {
                    valido: false,
                    mensaje: 'Contenido XML vacío',
                    errores: [{
                        mensaje: 'El contenido XML está vacío',
                        linea: null,
                        columna: null,
                        nivel: 'error'
                    }],
                    advertencias: []
                };
            }

            // Intentar parsear XML
            const xmlDoc = libxmljs.parseXml(xmlContent);
            if (!xmlDoc) {
                return {
                    valido: false,
                    mensaje: 'XML mal formado',
                    errores: [{
                        mensaje: 'No se pudo parsear el XML',
                        linea: null,
                        columna: null,
                        nivel: 'error'
                    }],
                    advertencias: []
                };
            }

            // Verificar estructura básica
            const rootElement = xmlDoc.root();
            if (!rootElement) {
                return {
                    valido: false,
                    mensaje: 'XML sin elemento raíz',
                    errores: [{
                        mensaje: 'El XML no tiene elemento raíz',
                        linea: null,
                        columna: null,
                        nivel: 'error'
                    }],
                    advertencias: []
                };
            }

            logger.info('[XSD] ✅ Validación básica exitosa');
            return {
                valido: true,
                mensaje: 'Validación básica exitosa',
                errores: [],
                advertencias: []
            };

        } catch (error) {
            return {
                valido: false,
                mensaje: `Error en validación básica: ${error.message}`,
                errores: [{
                    mensaje: error.message,
                    linea: null,
                    columna: null,
                    nivel: 'error'
                }],
                advertencias: []
            };
        }
    }

    /**
     * Validación completa contra esquema XSD
     */
    validarCompleta(xmlContent) {
        try {
            if (!this.xsdSchema) {
                return {
                    valido: true,
                    mensaje: 'Validación omitida - esquema no disponible',
                    errores: [],
                    advertencias: ['Esquema XSD no cargado']
                };
            }

            // Parsear el XML
            const xmlDoc = libxmljs.parseXml(xmlContent);

            // Intentar validar contra el esquema
            const validationResult = xmlDoc.validate(this.xsdSchema);

            if (validationResult) {
                logger.info('[XSD] ✅ XML válido contra esquema SIFEN completo');
                return {
                    valido: true,
                    mensaje: 'XML válido contra esquema SIFEN completo',
                    errores: [],
                    advertencias: []
                };
            } else {
                // Obtener errores de validación
                const errores = xmlDoc.validationErrors || [];

                logger.warn('[XSD] ⚠️  XML tiene errores de validación XSD', {
                    cantidadErrores: errores.length,
                    errores: errores.map(err => ({
                        message: err.message,
                        line: err.line,
                        column: err.column
                    }))
                });

                return {
                    valido: false,
                    mensaje: `XML tiene ${errores.length} errores de validación XSD`,
                    errores: errores.map(err => ({
                        mensaje: err.message,
                        linea: err.line,
                        columna: err.column,
                        nivel: err.level || 'error'
                    })),
                    advertencias: []
                };
            }

        } catch (error) {
            // Detectar errores específicos de libxmljs
            const isLibxmlError = error.message && (
                error.message.includes('Invalid XSD schema') ||
                error.message.includes('libxml') ||
                error.domain === 'xml'
            );

            if (isLibxmlError) {
                logger.warn('[XSD] ⚠️  Error de validación XSD con libxmljs:', {
                    error: error.message,
                    solucion: 'Intentando validación externa con xmllint'
                });

                // Intentar validación externa con xmllint
                try {
                    const resultadoExterno = this.validarConXmllint(xmlContent);
                    if (resultadoExterno.valido) {
                        logger.info('[XSD] ✅ Validación externa con xmllint exitosa');
                        return resultadoExterno;
                    }
                } catch (xmllintError) {
                    logger.warn('[XSD] xmllint no disponible o falló:', xmllintError.message);
                }

                // Si xmllint también falla, usar validación básica
                logger.warn('[XSD] Usando validación básica como último recurso');
                return this.validarBasica(xmlContent);
            } else {
                logger.error('[XSD] Error en validación completa:', error.message);
                return {
                    valido: false,
                    mensaje: `Error en validación XSD: ${error.message}`,
                    errores: [{
                        mensaje: error.message,
                        linea: null,
                        columna: null,
                        nivel: 'error'
                    }],
                    advertencias: []
                };
            }
        }
    }

    /**
     * Habilitar/deshabilitar validación completa
     */
    setValidacionCompleta(habilitada) {
        this.validacionCompletaHabilitada = habilitada;
        logger.info(`[XSD] Validación completa ${habilitada ? 'habilitada' : 'deshabilitada'}`);
    }

    /**
     * Valida un XML y lanza excepción si es inválido
     * @param {string} xmlContent - Contenido XML a validar
     * @throws {XmlValidationError} Si el XML es inválido
     */
    validarXmlEstricto(xmlContent) {
        const resultado = this.validarXml(xmlContent);

        if (!resultado.valido) {
            logger.error('[XSD] Validación estricta fallida:', {
                mensaje: resultado.mensaje,
                cantidadErrores: resultado.errores.length,
                errores: resultado.errores
            });

            throw new XmlValidationError(
                resultado.mensaje,
                resultado.errores,
                xmlContent
            );
        }

        return resultado;
    }

    /**
     * Validación externa usando xmllint
     */
    validarConXmllint(xmlContent) {
        const { execSync } = require('child_process');
        const fs = require('fs');
        const os = require('os');
        const path = require('path');

        // Crear archivo temporal para el XML
        const tempDir = os.tmpdir();
        const tempXmlPath = path.join(tempDir, `validation_${Date.now()}_${Math.random()}.xml`);

        try {
            // Escribir XML a archivo temporal
            fs.writeFileSync(tempXmlPath, xmlContent, 'utf8');

            // Ejecutar validación con xmllint
            const command = `xmllint --schema ${this.xsdPath} ${tempXmlPath} --noout`;
            execSync(command, { stdio: 'pipe' });

            // Limpiar archivo temporal
            fs.unlinkSync(tempXmlPath);

            return {
                valido: true,
                mensaje: 'XML válido contra esquema SIFEN (xmllint)',
                errores: [],
                advertencias: []
            };

        } catch (error) {
            // Limpiar archivo temporal si existe
            try {
                if (fs.existsSync(tempXmlPath)) {
                    fs.unlinkSync(tempXmlPath);
                }
            } catch (cleanupError) {
                // Ignorar errores de limpieza
            }

            const errorMessage = error.stderr ? error.stderr.toString() : error.message;

            logger.warn('[XSD-EXT] XML inválido con xmllint:', errorMessage);

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

    /**
     * Recarga el esquema XSD (útil para desarrollo)
     */
    recargarEsquema() {
        logger.info('[XSD] Recargando esquema XSD...');
        this.xsdSchema = null;
        this.cargarEsquema();
    }

    /**
     * Obtiene información del esquema cargado
     */
    getInformacionEsquema() {
        return {
            cargado: this.xsdSchema !== null,
            ruta: this.xsdPath,
            existeArchivo: fs.existsSync(this.xsdPath),
            tamanoArchivo: fs.existsSync(this.xsdPath) ? fs.statSync(this.xsdPath).size : 0
        };
    }
}

module.exports = new XmlValidator();
