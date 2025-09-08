/**
 * Clase de error personalizada para validación XSD
 */
class XmlValidationError extends Error {
    constructor(mensaje, errores = [], xmlContent = null) {
        super(mensaje);
        this.name = 'XmlValidationError';
        this.errores = errores;
        this.xmlContent = xmlContent;
        this.timestamp = new Date().toISOString();

        // Capturar stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, XmlValidationError);
        }
    }

    /**
     * Obtiene un resumen de los errores
     */
    getResumenErrores() {
        return {
            totalErrores: this.errores.length,
            erroresCriticos: this.errores.filter(e => e.nivel === 'error').length,
            erroresAdvertencia: this.errores.filter(e => e.nivel === 'warning').length,
            primerError: this.errores[0] || null
        };
    }

    /**
     * Convierte el error a formato JSON para logging
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            timestamp: this.timestamp,
            errores: this.errores,
            resumen: this.getResumenErrores(),
            xmlLength: this.xmlContent ? this.xmlContent.length : 0
        };
    }

    /**
     * Genera mensaje de error formateado para usuario
     */
    getMensajeUsuario() {
        const resumen = this.getResumenErrores();
        let mensaje = `Validación XSD fallida: ${resumen.totalErrores} error(es) encontrado(s)`;

        if (resumen.primerError) {
            mensaje += `\nPrimer error: ${resumen.primerError.mensaje}`;
            if (resumen.primerError.linea) {
                mensaje += ` (línea ${resumen.primerError.linea})`;
            }
        }

        return mensaje;
    }
}

module.exports = XmlValidationError;
