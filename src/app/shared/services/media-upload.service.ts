import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, filter, tap, catchError, finalize } from 'rxjs/operators';

/**
 * Estado del progreso de subida de archivos
 */
export interface ProgresoSubidaMedia {
    estado: 'inactivo' | 'subiendo' | 'completado' | 'error';
    progreso: number;
    url?: string;
    error?: string;
}

/**
 * Configuración de Cloudinary
 */
interface ConfiguracionCloudinary {
    cloudName: string;
    uploadPreset: string;
}

/**
 * Servicio para subir archivos multimedia a Cloudinary.
 * Soporta imágenes, videos, audio y documentos.
 */
@Injectable({
    providedIn: 'root'
})
export class MediaUploadService {
    private readonly http = inject(HttpClient);

    private readonly configuracion: ConfiguracionCloudinary = {
        cloudName: 'daf3cny90',
        uploadPreset: 'frc-sistemas-informaticos'
    };

    private readonly _progreso$ = new BehaviorSubject<ProgresoSubidaMedia>({
        estado: 'inactivo',
        progreso: 0
    });

    readonly progreso$ = this._progreso$.asObservable();

    /**
     * Sube un archivo a Cloudinary
     * @param archivo - Archivo a subir (File)
     * @returns Observable con la URL del archivo subido
     */
    subirArchivo(archivo: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', archivo);
        formData.append('upload_preset', this.configuracion.uploadPreset);

        this._progreso$.next({ estado: 'subiendo', progreso: 0 });

        const url = `https://api.cloudinary.com/v1_1/${this.configuracion.cloudName}/auto/upload`;

        return this.http.post<{ secure_url: string }>(url, formData, {
            reportProgress: true,
            observe: 'events'
        }).pipe(
            tap(evento => {
                if (evento.type === HttpEventType.UploadProgress && evento.total) {
                    const progreso = Math.round(100 * evento.loaded / evento.total);
                    this._progreso$.next({ estado: 'subiendo', progreso });
                }
            }),
            filter(evento => evento.type === HttpEventType.Response),
            map(evento => {
                const respuesta = evento as { body: { secure_url: string } };
                const urlArchivo = respuesta.body.secure_url;
                this._progreso$.next({ estado: 'completado', progreso: 100, url: urlArchivo });
                return urlArchivo;
            }),
            catchError(error => {
                const mensajeError = error?.error?.message || 'Error al subir archivo';
                this._progreso$.next({ estado: 'error', progreso: 0, error: mensajeError });
                throw error;
            }),
            finalize(() => {
                // Resetear estado después de un breve delay
                setTimeout(() => {
                    if (this._progreso$.value.estado !== 'subiendo') {
                        this._progreso$.next({ estado: 'inactivo', progreso: 0 });
                    }
                }, 2000);
            })
        );
    }

    /**
     * Sube un blob de audio a Cloudinary
     * @param blob - Blob de audio grabado
     * @param nombreArchivo - Nombre para el archivo (opcional)
     * @returns Observable con la URL del audio subido
     */
    subirAudio(blob: Blob, nombreArchivo?: string): Observable<string> {
        const nombre = nombreArchivo || `audio_${Date.now()}.webm`;
        const archivo = new File([blob], nombre, { type: 'audio/webm' });
        return this.subirArchivo(archivo);
    }

    /**
     * Verifica si hay una subida en progreso
     */
    estaSubiendo(): boolean {
        return this._progreso$.value.estado === 'subiendo';
    }

    /**
     * Obtiene el progreso actual de subida
     */
    obtenerProgreso(): number {
        return this._progreso$.value.progreso;
    }

    /**
     * Resetea el estado de subida
     */
    resetear(): void {
        this._progreso$.next({ estado: 'inactivo', progreso: 0 });
    }
}
