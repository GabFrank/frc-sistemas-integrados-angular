import { Injectable } from '@angular/core';

/**
 * Tipos de media soportados
 */
export type TipoMedia =
    | 'audio'
    | 'video'
    | 'imagen'
    | 'pdf'
    | 'documento'
    | 'hoja_calculo'
    | 'presentacion'
    | 'comprimido'
    | 'texto'
    | 'desconocido';

/**
 * Extensiones por tipo de archivo
 */
const EXTENSIONES_AUDIO = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac', '.flac'];
const EXTENSIONES_VIDEO = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const EXTENSIONES_IMAGEN = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
const EXTENSIONES_PDF = ['.pdf'];
const EXTENSIONES_DOCUMENTO = ['.doc', '.docx'];
const EXTENSIONES_HOJA_CALCULO = ['.xls', '.xlsx'];
const EXTENSIONES_PRESENTACION = ['.ppt', '.pptx'];
const EXTENSIONES_COMPRIMIDO = ['.zip', '.rar', '.7z', '.tar', '.gz'];
const EXTENSIONES_TEXTO = ['.txt'];

/**
 * Servicio para detectar y clasificar tipos de archivos multimedia.
 * Proporciona métodos para identificar el tipo de archivo basándose en la URL o extensión.
 */
@Injectable({
    providedIn: 'root'
})
export class MediaTypeService {

    /**
     * Verifica si la URL corresponde a un archivo de audio
     */
    esAudio(url: string): boolean {
        return this.verificarExtension(url, EXTENSIONES_AUDIO);
    }

    /**
     * Verifica si la URL corresponde a un archivo de video
     */
    esVideo(url: string): boolean {
        if (!url) return false;
        // Excluir .webm que también puede ser audio
        const urlLower = url.toLowerCase();
        if (urlLower.includes('.webm')) {
            // Si contiene 'audio' en la URL, es audio
            return !urlLower.includes('audio');
        }
        return this.verificarExtension(url, EXTENSIONES_VIDEO.filter(e => e !== '.webm'));
    }

    /**
     * Verifica si la URL corresponde a una imagen
     */
    esImagen(url: string): boolean {
        return this.verificarExtension(url, EXTENSIONES_IMAGEN);
    }

    /**
     * Verifica si la URL corresponde a un PDF
     */
    esPdf(url: string): boolean {
        return this.verificarExtension(url, EXTENSIONES_PDF);
    }

    /**
     * Verifica si la URL corresponde a un documento Word
     */
    esDocumento(url: string): boolean {
        return this.verificarExtension(url, EXTENSIONES_DOCUMENTO);
    }

    /**
     * Verifica si la URL corresponde a una hoja de cálculo Excel
     */
    esHojaCalculo(url: string): boolean {
        return this.verificarExtension(url, EXTENSIONES_HOJA_CALCULO);
    }

    /**
     * Verifica si la URL corresponde a una presentación PowerPoint
     */
    esPresentacion(url: string): boolean {
        return this.verificarExtension(url, EXTENSIONES_PRESENTACION);
    }

    /**
     * Verifica si la URL corresponde a un archivo comprimido
     */
    esComprimido(url: string): boolean {
        return this.verificarExtension(url, EXTENSIONES_COMPRIMIDO);
    }

    /**
     * Verifica si la URL corresponde a un archivo de texto
     */
    esTexto(url: string): boolean {
        return this.verificarExtension(url, EXTENSIONES_TEXTO);
    }

    /**
     * Obtiene el tipo de media de una URL
     * Útil para usar directamente en templates con ngSwitch
     */
    obtenerTipoMedia(url: string): TipoMedia {
        if (!url) return 'desconocido';

        if (this.esAudio(url)) return 'audio';
        if (this.esVideo(url)) return 'video';
        if (this.esPdf(url)) return 'pdf';
        if (this.esDocumento(url)) return 'documento';
        if (this.esHojaCalculo(url)) return 'hoja_calculo';
        if (this.esPresentacion(url)) return 'presentacion';
        if (this.esComprimido(url)) return 'comprimido';
        if (this.esTexto(url)) return 'texto';
        if (this.esImagen(url)) return 'imagen';

        return 'desconocido';
    }

    /**
     * Extrae el nombre del archivo de una URL
     */
    obtenerNombreArchivo(url: string): string {
        if (!url) return 'archivo';
        const partes = url.split('/');
        const nombreConParametros = partes[partes.length - 1] || 'archivo';
        // Eliminar parámetros de query string
        return nombreConParametros.split('?')[0];
    }

    /**
     * Obtiene el icono de Material correspondiente al tipo de media
     */
    obtenerIcono(tipo: TipoMedia): string {
        const iconos: Record<TipoMedia, string> = {
            audio: 'graphic_eq',
            video: 'videocam',
            imagen: 'image',
            pdf: 'picture_as_pdf',
            documento: 'description',
            hoja_calculo: 'table_chart',
            presentacion: 'slideshow',
            comprimido: 'folder_zip',
            texto: 'text_snippet',
            desconocido: 'insert_drive_file'
        };
        return iconos[tipo];
    }

    /**
     * Verifica si una URL contiene alguna de las extensiones dadas
     */
    private verificarExtension(url: string, extensiones: readonly string[]): boolean {
        if (!url) return false;
        const urlLower = url.toLowerCase();
        return extensiones.some(ext => urlLower.includes(ext));
    }
}
