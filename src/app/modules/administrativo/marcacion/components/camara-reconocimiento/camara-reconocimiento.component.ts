import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    ElementRef,
    OnDestroy
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

import { CamaraService } from '../../../../../shared/services/camara.service';
import { ReconocimientoFacialHelperService } from '../../service/reconocimiento-facial-helper.service';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { EmbeddingGaleria, FrameCalidadFacial, FRAMES_MINIMOS_VERIFICACION, HITS_CONSECUTIVOS_VERIFICACION, UMBRAL_SIMILITUD_VERIFICACION } from '../../models/embedding-galeria.model';

export type ModoCamara = 'busqueda' | 'verificacion' | 'captura-perfil' | 'captura-multiple';

@UntilDestroy()
@Component({
    selector: 'camara-reconocimiento',
    templateUrl: './camara-reconocimiento.component.html',
    styleUrls: ['./camara-reconocimiento.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CamaraReconocimientoComponent implements OnDestroy {

    @Input() modo: ModoCamara = 'busqueda';
    @Input() referenciaGaleria: EmbeddingGaleria | null = null;
    @Input() usuarioSeleccionado: Usuario | null = null;
    @Input() usuarioActualId: number | null = null;

    @Output() usuarioIdentificado = new EventEmitter<Usuario>();
    @Output() identidadVerificada = new EventEmitter<{ embedding: number[], snapshotUrl: string, score: number }>();
    @Output() fotoPerfilGuardada = new EventEmitter<void>();
    @Output() cerrar = new EventEmitter<void>();
    @Output() busquedaManual = new EventEmitter<void>();
    @Output() similitudInsuficiente = new EventEmitter<boolean>();

    @ViewChild('video') videoElement: ElementRef<HTMLVideoElement>;
    @ViewChild('snapshotCanvas') snapshotCanvas: ElementRef<HTMLCanvasElement>;

    detecting = false;
    mensajeReconocimiento = '';
    verificacionSnapshotUrl: string | null = null;
    porcentajeSimilitud: number | null = null;
    progresoVerificacion = 0;
    barraSimilitudClase = '';

    capturaMultiplePaso = 0;
    capturaMultipleFotos: Array<{ imageBase64: string; embedding: number[]; score: number }> = [];
    capturaMultipleMensajes = [
        '',
        'Paso 1/3: Gire su rostro ligeramente a la IZQUIERDA',
        'Paso 2/3: Gire su rostro ligeramente a la DERECHA',
        'Paso 3/3: Mire de FRENTE a la cámara'
    ];

    private framesVerificacion: FrameCalidadFacial[] = [];
    private hitsConsecutivosVerificacion = 0;

    esperandoCapturaPerfil = false;

    private embeddingCapturado: number[] | null = null;
    private busquedaLoopActivo = false;
    private busquedaApiEnCurso = false;
    private busquedaProcesandoFrame = false;
    private busquedaLoopTimer: ReturnType<typeof setTimeout> | null = null;
    private ultimaBusquedaApi = 0;
    private hitsConsecutivos = 0;

    private deteccionLoopActivo = false;
    private ultimoFrameProcesado = 0;
    private procesandoFrame = false;
    private readonly INTERVALO_DETECCION_MS = 400;

    private readonly INTERVALO_LOOP_MS = 400;
    private readonly INTERVALO_MIN_API_MS = 700;
    private readonly HITS_PARA_CONFIRMAR = 2;

    constructor(
        private cdr: ChangeDetectorRef,
        private camaraService: CamaraService,
        private faceHelper: ReconocimientoFacialHelperService
    ) { }

    ngOnDestroy(): void {
        this.detenerBusquedaContinua();
        this.detenerDeteccionContinua();
        this.camaraService.detenerCamara(this.videoElement?.nativeElement);
    }

    async iniciar(): Promise<void> {
        switch (this.modo) {
            case 'busqueda':
                await this.iniciarCamaraBusqueda();
                break;
            case 'verificacion':
                await this.iniciarCamaraParaVerificacion();
                break;
            case 'captura-perfil':
                await this.iniciarCapturaMultiple();
                break;
            case 'captura-multiple':
                await this.iniciarCapturaMultiple();
                break;
        }
    }

    private async iniciarCamaraBusqueda(): Promise<void> {
        this.limpiarEstados();
        this.mensajeReconocimiento = 'Cargando modelos de reconocimiento...';
        this.cdr.detectChanges();

        try {
            await this.faceHelper.inicializarMotorFacial();
            await this.prepararVideoParaDeteccion();
            this.detecting = true;
            this.busquedaLoopActivo = true;
            this.actualizarSimilitud(null);
            this.mensajeReconocimiento = 'Mire a la cámara para identificarse';
            this.cdr.markForCheck();
            this.bucleBusquedaContinua();
        } catch (e) {
            console.error('Error en iniciarCamaraBusqueda:', e);
            this.mensajeReconocimiento = 'Error al acceder a la cámara.';
            this.detecting = false;
            this.camaraService.detenerCamara(this.videoElement?.nativeElement);
            this.cdr.markForCheck();
        }
    }

    private detenerBusquedaContinua(): void {
        this.busquedaLoopActivo = false;
        this.busquedaApiEnCurso = false;
        this.hitsConsecutivos = 0;
        if (this.busquedaLoopTimer) {
            clearTimeout(this.busquedaLoopTimer);
            this.busquedaLoopTimer = null;
        }
    }

    private async bucleBusquedaContinua(): Promise<void> {
        if (!this.busquedaLoopActivo || !this.videoElement) {
            return;
        }

        const video = this.videoElement.nativeElement;
        if (video.paused || video.ended) {
            this.busquedaLoopTimer = setTimeout(() => this.bucleBusquedaContinua(), 100);
            return;
        }

        const ahora = Date.now();
        if (!this.busquedaApiEnCurso && !this.busquedaProcesandoFrame && ahora - this.ultimaBusquedaApi >= this.INTERVALO_MIN_API_MS) {
            this.busquedaProcesandoFrame = true;
            try {
                const evaluacion = await this.faceHelper.evaluarFrameBusqueda(video);
                this.mensajeReconocimiento = evaluacion.mensaje;

                if (!evaluacion.rostroDetectado) {
                    this.hitsConsecutivos = 0;
                    this.actualizarSimilitud(null);
                } else if (!evaluacion.embedding) {
                    this.hitsConsecutivos = 0;
                    this.actualizarSimilitud(null);
                } else {
                    this.busquedaApiEnCurso = true;
                    this.mensajeReconocimiento = 'Buscando coincidencia...';
                    this.cdr.markForCheck();

                    const resultado = await this.faceHelper.buscarUsuarioPorEmbedding(evaluacion.embedding, []);
                    this.ultimaBusquedaApi = Date.now();
                    this.busquedaApiEnCurso = false;

                    if (resultado) {
                        const pct = Math.round(resultado.similitudBackend * 100);
                        this.actualizarSimilitud(pct, resultado.confiable);

                        if (resultado.confiable) {
                            this.hitsConsecutivos++;
                            this.mensajeReconocimiento = `Identificando... ${resultado.usuario.persona?.nombre} (${pct}%)`;

                            if (this.hitsConsecutivos >= this.HITS_PARA_CONFIRMAR) {
                                this.detenerBusquedaContinua();
                                this.detecting = false;
                                this.mensajeReconocimiento = `✓ ${resultado.usuario.persona?.nombre} (${pct}%)`;
                                this.cdr.markForCheck();
                                video.pause();
                                this.camaraService.detenerCamara(video);
                                setTimeout(() => this.usuarioIdentificado.emit(resultado.usuario), 400);
                                return;
                            }
                        } else {
                            this.hitsConsecutivos = 0;
                            this.mensajeReconocimiento = `Sin coincidencia (${pct}%). ¿Está enrolado en el sistema?`;
                        }
                    } else {
                        this.hitsConsecutivos = 0;
                        this.actualizarSimilitud(null);
                        this.mensajeReconocimiento = 'Rostro detectado. No hay usuarios enrolados en el servidor.';
                    }
                }
            } catch (e) {
                console.error('Error en búsqueda continua:', e);
                this.busquedaApiEnCurso = false;
                this.hitsConsecutivos = 0;
                this.actualizarSimilitud(null);
                this.mensajeReconocimiento = 'Error en la búsqueda. Reintentando...';
            } finally {
                this.busquedaProcesandoFrame = false;
            }
        }

        this.cdr.markForCheck();
        if (this.busquedaLoopActivo) {
            this.busquedaLoopTimer = setTimeout(() => this.bucleBusquedaContinua(), this.INTERVALO_LOOP_MS);
        }
    }

    detenerAutoSearchPublic(): void {
        this.detenerBusquedaContinua();
        this.detecting = false;
        this.mensajeReconocimiento = 'Búsqueda detenida.';
        this.cdr.markForCheck();
    }

    async retomarCamara(): Promise<void> {
        this.detenerBusquedaContinua();
        this.camaraService.detenerCamara(this.videoElement?.nativeElement);
        await this.iniciarCamaraBusqueda();
    }

    onBusquedaManual(): void {
        this.busquedaManual.emit();
    }

    onCerrar(): void {
        this.limpiarEstados();
        this.camaraService.detenerCamara(this.videoElement?.nativeElement);
        this.cerrar.emit();
    }

    private async iniciarCamaraParaVerificacion(): Promise<void> {
        this.detenerDeteccionContinua();
        this.framesVerificacion = [];
        this.hitsConsecutivosVerificacion = 0;
        this.mensajeReconocimiento = 'Iniciando cámara...';
        this.cdr.detectChanges();

        try {
            await this.faceHelper.inicializarMotorFacial();
            await this.prepararVideoParaDeteccion();
            this.detecting = true;
            this.mensajeReconocimiento = 'Mire de frente a la cámara';
            this.cdr.markForCheck();
            await new Promise(resolve => setTimeout(resolve, 300));
            this.iniciarBucleDeteccion();
        } catch (e) {
            console.error('Error en iniciarCamaraParaVerificacion:', e);
            this.mensajeReconocimiento = 'Error al acceder a la cámara';
            this.detecting = false;
            this.camaraService.detenerCamara(this.videoElement?.nativeElement);
        }
        this.cdr.markForCheck();
    }

    private detenerDeteccionContinua(): void {
        this.deteccionLoopActivo = false;
    }

    private iniciarBucleDeteccion(): void {
        this.deteccionLoopActivo = true;
        void this.bucleDeteccion();
    }

    private async bucleDeteccion(): Promise<void> {
        if (!this.deteccionLoopActivo || !this.detecting || !this.videoElement || !this.referenciaGaleria) return;

        const video = this.videoElement.nativeElement;
        if (video.paused || video.ended || video.videoWidth === 0) {
            setTimeout(() => this.bucleDeteccion(), 100);
            return;
        }

        const ahora = Date.now();
        if (!this.procesandoFrame && ahora - this.ultimoFrameProcesado >= this.INTERVALO_DETECCION_MS) {
            this.ultimoFrameProcesado = ahora;
            this.procesandoFrame = true;

            try {
                const umbralSimilitud = UMBRAL_SIMILITUD_VERIFICACION;
                const evaluacion = await this.faceHelper.evaluarFrameVerificacion(
                    video,
                    this.referenciaGaleria,
                    umbralSimilitud
                );
                this.mensajeReconocimiento = evaluacion.mensaje;

                if (evaluacion.similitud != null) {
                    this.actualizarSimilitud(
                        Math.round(evaluacion.similitud * 100),
                        evaluacion.calidadOk,
                        umbralSimilitud
                    );
                } else {
                    this.actualizarSimilitud(null);
                }

                if (evaluacion.calidadOk && evaluacion.embedding && evaluacion.score != null) {
                    this.hitsConsecutivosVerificacion++;
                    this.framesVerificacion.push({
                        embedding: evaluacion.embedding,
                        score: evaluacion.score,
                        similitud: evaluacion.similitud
                    });
                    if (this.framesVerificacion.length > 6) {
                        this.framesVerificacion.shift();
                    }

                    this.progresoVerificacion = Math.min(
                        100,
                        Math.round((this.framesVerificacion.length / FRAMES_MINIMOS_VERIFICACION) * 100)
                    );
                    this.similitudInsuficiente.emit(false);

                    if (
                        this.hitsConsecutivosVerificacion >= HITS_CONSECUTIVOS_VERIFICACION
                        && this.framesVerificacion.length >= FRAMES_MINIMOS_VERIFICACION
                    ) {
                        const verificado = this.faceHelper.confirmarVerificacionFinal(
                            this.framesVerificacion,
                            this.referenciaGaleria,
                            umbralSimilitud
                        );
                        if (!verificado) {
                            this.reiniciarAcumulacionVerificacion();
                            this.mensajeReconocimiento = 'Mantenga el rostro estable frente a la cámara';
                        } else {
                            const pct = Math.round(verificado.similitud * 100);
                            this.mensajeReconocimiento = `✓ Rostro verificado (${pct}%)`;
                            this.progresoVerificacion = 100;
                            this.embeddingCapturado = verificado.embedding;
                            this.detecting = false;
                            this.detenerDeteccionContinua();
                            this.verificacionSnapshotUrl = this.camaraService.capturarFoto(video);
                            video.pause();
                            this.camaraService.detenerCamara(video);
                            this.identidadVerificada.emit({
                                embedding: verificado.embedding,
                                snapshotUrl: this.verificacionSnapshotUrl,
                                score: verificado.score
                            });
                            this.cdr.markForCheck();
                            return;
                        }
                    }
                } else if (!evaluacion.rostroDetectado) {
                    this.reiniciarAcumulacionVerificacion();
                    this.similitudInsuficiente.emit(false);
                } else if (evaluacion.similitud != null && evaluacion.similitud < umbralSimilitud) {
                    this.reiniciarAcumulacionVerificacion();
                    this.similitudInsuficiente.emit(true);
                } else if (evaluacion.rostroDetectado) {
                    this.hitsConsecutivosVerificacion = 0;
                    this.progresoVerificacion = Math.min(
                        100,
                        Math.round((this.framesVerificacion.length / FRAMES_MINIMOS_VERIFICACION) * 100)
                    );
                } else {
                    this.progresoVerificacion = Math.min(
                        100,
                        Math.round((this.framesVerificacion.length / FRAMES_MINIMOS_VERIFICACION) * 100)
                    );
                }

                this.cdr.markForCheck();
            } finally {
                this.procesandoFrame = false;
            }
        }

        if (this.deteccionLoopActivo) {
            setTimeout(() => this.bucleDeteccion(), 50);
        }
    }

    private reiniciarAcumulacionVerificacion(): void {
        this.hitsConsecutivosVerificacion = 0;
        this.framesVerificacion = [];
        this.progresoVerificacion = 0;
    }

    private actualizarSimilitud(
        porcentaje: number | null,
        exito = false,
        umbralSimilitud = UMBRAL_SIMILITUD_VERIFICACION
    ): void {
        this.porcentajeSimilitud = porcentaje;
        if (porcentaje == null) {
            this.barraSimilitudClase = '';
            return;
        }
        const umbralPct = Math.round(umbralSimilitud * 100);
        if (exito || porcentaje >= umbralPct) {
            this.barraSimilitudClase = 'similitud-alta';
        } else if (porcentaje >= umbralPct - 15) {
            this.barraSimilitudClase = 'similitud-media';
        } else {
            this.barraSimilitudClase = 'similitud-baja';
        }
    }

    async tomarFotoPerfil(): Promise<void> {
        await this.tomarFotoPerfilMultiple();
    }

    private async iniciarCapturaMultiple(): Promise<void> {
        this.capturaMultiplePaso = 1;
        this.capturaMultipleFotos = [];
        this.mensajeReconocimiento = 'Cargando modelos de reconocimiento facial...';
        this.detecting = true;
        this.cdr.detectChanges();

        try {
            await this.faceHelper.inicializarMotorFacial();
            this.mensajeReconocimiento = this.capturaMultipleMensajes[1];
            await this.prepararVideoParaDeteccion();
        } catch (e) {
            console.error('Error en capturaMultiple:', e);
            this.mensajeReconocimiento = 'No se pudo acceder a la cámara.';
            this.capturaMultiplePaso = 0;
            this.camaraService.detenerCamara(this.videoElement?.nativeElement);
        } finally {
            this.detecting = false;
            this.cdr.markForCheck();
        }
    }

    async tomarFotoPerfilMultiple(): Promise<void> {
        if (!this.videoElement || !this.usuarioSeleccionado || this.capturaMultiplePaso === 0 || this.detecting) {
            return;
        }

        const video = this.videoElement.nativeElement;
        this.detecting = true;
        this.mensajeReconocimiento = 'Capturando foto...';
        this.cdr.markForCheck();

        try {
            await this.esperarVideoListo();
            const resultado = await this.faceHelper.capturarFrameConScore(video);

            if (!resultado) {
                this.mensajeReconocimiento = `No se detectó rostro. ${this.capturaMultipleMensajes[this.capturaMultiplePaso]}`;
                return;
            }

            this.capturaMultipleFotos.push(resultado);

            if (this.capturaMultiplePaso < 3) {
                this.capturaMultiplePaso++;
                this.mensajeReconocimiento = this.capturaMultipleMensajes[this.capturaMultiplePaso];
                return;
            }

            this.mensajeReconocimiento = 'Procesando galería facial...';
            this.cdr.markForCheck();

            const fotoFrontal = this.capturaMultipleFotos[this.capturaMultipleFotos.length - 1].imageBase64;
            const exito = await this.faceHelper.guardarFotoPerfilConEmbeddingMaestro(
                this.usuarioSeleccionado.id,
                fotoFrontal,
                this.capturaMultipleFotos
            );

            if (exito) {
                this.camaraService.detenerCamara(this.videoElement?.nativeElement);
                this.capturaMultiplePaso = 0;
                this.capturaMultipleFotos = [];
                this.fotoPerfilGuardada.emit();
            } else {
                this.capturaMultiplePaso = 1;
                this.capturaMultipleFotos = [];
                this.mensajeReconocimiento = this.capturaMultipleMensajes[1];
            }
        } catch (error) {
            console.error('Error al capturar foto de perfil:', error);
            this.mensajeReconocimiento = 'Error al procesar la foto. Intente de nuevo.';
        } finally {
            this.detecting = false;
            this.cdr.markForCheck();
        }
    }

    private limpiarEstados(): void {
        this.detenerBusquedaContinua();
        this.detenerDeteccionContinua();
        this.detecting = false;
        this.mensajeReconocimiento = '';
        this.embeddingCapturado = null;
        this.esperandoCapturaPerfil = false;
        this.capturaMultipleFotos = [];
        this.framesVerificacion = [];
        this.hitsConsecutivosVerificacion = 0;
        this.porcentajeSimilitud = null;
        this.progresoVerificacion = 0;
        this.barraSimilitudClase = '';
    }

    private async prepararVideoParaDeteccion(reintentos = 1): Promise<void> {
        let ultimoError: unknown = null;

        for (let intento = 0; intento <= reintentos; intento++) {
            try {
                if (intento > 0) {
                    this.camaraService.detenerCamara(this.videoElement?.nativeElement);
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                const stream = await this.camaraService.iniciarCamara();
                await this.esperarVideoElement();
                const video = this.videoElement.nativeElement;
                video.srcObject = stream;
                video.muted = true;
                video.playsInline = true;
                video.autoplay = true;

                await this.reproducirVideo(video);
                await this.esperarVideoListo();
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    return;
                }
                ultimoError = new Error('La cámara no entregó frames');
            } catch (error) {
                ultimoError = error;
            }
        }

        throw ultimoError ?? new Error('No se pudo iniciar la cámara');
    }

    private async reproducirVideo(video: HTMLVideoElement): Promise<void> {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            await video.play();
            return;
        }

        await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error('Timeout al iniciar video')), 8000);
            const onReady = async () => {
                clearTimeout(timeoutId);
                video.removeEventListener('loadedmetadata', onReady);
                try {
                    await video.play();
                    resolve();
                } catch (playError) {
                    reject(playError);
                }
            };
            video.addEventListener('loadedmetadata', onReady);
        });
    }

    private async esperarVideoElement(): Promise<void> {
        for (let i = 0; i < 20; i++) {
            if (this.videoElement) break;
            await new Promise(resolve => setTimeout(resolve, 100));
            this.cdr.detectChanges();
        }
        if (!this.videoElement) {
            throw new Error('No se encontró el elemento de video');
        }
    }

    private async esperarVideoListo(): Promise<void> {
        if (!this.videoElement) {
            return;
        }
        const video = this.videoElement.nativeElement;
        for (let i = 0; i < 30; i++) {
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}
