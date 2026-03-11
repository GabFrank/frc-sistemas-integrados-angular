import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface EstadoGrabacion {
    grabando: boolean;
    audioGrabado: Blob | null;
    urlAudio: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class AudioRecordingService {
    private readonly ngZone = inject(NgZone);

    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private temporizador: ReturnType<typeof setInterval> | null = null;
    private stream: MediaStream | null = null;

    private readonly _estado$ = new BehaviorSubject<EstadoGrabacion>({
        grabando: false,
        audioGrabado: null,
        urlAudio: null
    });

    private readonly _duracion$ = new BehaviorSubject<number>(0);
    private readonly _audioCompletado$ = new Subject<Blob>();

    readonly estado$ = this._estado$.asObservable();
    readonly duracion$ = this._duracion$.asObservable();

    readonly duracionFormateada$: Observable<string> = new Observable(observer => {
        return this._duracion$.subscribe(segundos => {
            observer.next(this.formatearTiempo(segundos));
        });
    });

    private formatearTiempo(segundos: number): string {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }

    /**
     * Inicia la grabación de audio
     * @throws Error si no se puede acceder al micrófono
     */
    async iniciarGrabacion(): Promise<void> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];
            this._duracion$.next(0);

            this.mediaRecorder.ondataavailable = (evento) => {
                if (evento.data.size > 0) {
                    this.audioChunks.push(evento.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const urlAudio = URL.createObjectURL(audioBlob);

                this.ngZone.run(() => {
                    this._estado$.next({
                        grabando: false,
                        audioGrabado: audioBlob,
                        urlAudio
                    });
                    this._audioCompletado$.next(audioBlob);
                });

                this.limpiarStream();
            };

            this.mediaRecorder.start();

            this.ngZone.run(() => {
                this._estado$.next({
                    grabando: true,
                    audioGrabado: null,
                    urlAudio: null
                });
            });

            this.temporizador = setInterval(() => {
                this.ngZone.run(() => {
                    this._duracion$.next(this._duracion$.value + 1);
                });
            }, 1000);

        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            throw error;
        }
    }

    /**
     * Detiene la grabación y emite el blob de audio
     * @returns Observable que emite el blob de audio grabado
     */
    detenerGrabacion(): Observable<Blob> {
        if (this.mediaRecorder && this._estado$.value.grabando) {
            this.mediaRecorder.stop();
            this.detenerTemporizador();
        }
        return this._audioCompletado$.asObservable();
    }

    cancelarGrabacion(): void {
        if (this.mediaRecorder && this._estado$.value.grabando) {
            this.mediaRecorder.stop();
        }

        this.detenerTemporizador();
        this.limpiarUrlAudio();
        this.limpiarStream();

        this._estado$.next({
            grabando: false,
            audioGrabado: null,
            urlAudio: null
        });
        this._duracion$.next(0);
        this.audioChunks = [];
    }

    eliminarAudioGrabado(): void {
        this.limpiarUrlAudio();
        this._estado$.next({
            grabando: false,
            audioGrabado: null,
            urlAudio: null
        });
        this._duracion$.next(0);
    }

    estaGrabando(): boolean {
        return this._estado$.value.grabando;
    }
    obtenerAudioGrabado(): Blob | null {
        return this._estado$.value.audioGrabado;
    }

    obtenerUrlAudio(): string | null {
        return this._estado$.value.urlAudio;
    }
    obtenerDuracion(): number {
        return this._duracion$.value;
    }
    obtenerDuracionFormateada(): string {
        return this.formatearTiempo(this._duracion$.value);
    }

    obtenerEstadoActual(): EstadoGrabacion {
        return this._estado$.value;
    }
    destruir(): void {
        this.cancelarGrabacion();
        this._estado$.complete();
        this._duracion$.complete();
        this._audioCompletado$.complete();
    }

    private detenerTemporizador(): void {
        if (this.temporizador) {
            clearInterval(this.temporizador);
            this.temporizador = null;
        }
    }

    private limpiarUrlAudio(): void {
        const estadoActual = this._estado$.value;
        if (estadoActual.urlAudio) {
            URL.revokeObjectURL(estadoActual.urlAudio);
        }
    }

    private limpiarStream(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}
