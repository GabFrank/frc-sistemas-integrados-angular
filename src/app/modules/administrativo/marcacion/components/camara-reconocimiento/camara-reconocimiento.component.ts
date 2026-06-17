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
import { EmbeddingGaleria } from '../../models/embedding-galeria.model';

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

    @Output() usuarioIdentificado = new EventEmitter<Usuario>();
    @Output() identidadVerificada = new EventEmitter<{ embedding: number[], snapshotUrl: string }>();
    @Output() fotoPerfilGuardada = new EventEmitter<void>();
    @Output() cerrar = new EventEmitter<void>();
    @Output() busquedaManual = new EventEmitter<void>();
    @Output() similitudInsuficiente = new EventEmitter<boolean>();

    @ViewChild('video') videoElement: ElementRef<HTMLVideoElement>;
    @ViewChild('snapshotCanvas') snapshotCanvas: ElementRef<HTMLCanvasElement>;

    detecting = false;
    mensajeReconocimiento = '';
    verificacionSnapshotUrl: string | null = null;

    capturaMultiplePaso = 0;
    capturaMultipleFotos: Array<{ imageBase64: string; embedding: number[]; score: number }> = [];
    capturaMultipleMensajes = [
        '',
        'Paso 1/3: Gire su rostro ligeramente a la IZQUIERDA',
        'Paso 2/3: Gire su rostro ligeramente a la DERECHA',
        'Paso 3/3: Mire de FRENTE a la cámara'
    ];

    livenessStep: 'BLINK' | 'DONE' = 'BLINK';
    livenessInstruction = 'Parpadee para verificar';
    private hasBlinked = false;

    esperandoCapturaPerfil = false;

    private embeddingCapturado: number[] | null = null;
    private busquedaLoopActivo = false;
    private busquedaApiEnCurso = false;
    private busquedaLoopTimer: ReturnType<typeof setTimeout> | null = null;
    private ultimaBusquedaApi = 0;
    private hitsConsecutivos = 0;

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
        this.camaraService.detenerCamara();
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
        this.mensajeReconocimiento = 'Iniciando cámara...';
        this.cdr.detectChanges();

        try {
            const stream = await this.camaraService.iniciarCamara();
            await this.esperarVideoElement();
            const video = this.videoElement.nativeElement;
            video.srcObject = stream;

            await new Promise<void>((resolve) => {
                video.onloadedmetadata = async () => {
                    await video.play().catch(err => console.error('Error al reproducir:', err));
                    resolve();
                };
            });

            this.detecting = true;
            this.busquedaLoopActivo = true;
            this.mensajeReconocimiento = 'Mire a la cámara para identificarse';
            this.cdr.markForCheck();
            this.bucleBusquedaContinua();
        } catch (e) {
            console.error('Error en iniciarCamaraBusqueda:', e);
            this.mensajeReconocimiento = 'Error al acceder a la cámara.';
            this.detecting = false;
            this.camaraService.detenerCamara();
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
        if (!this.busquedaApiEnCurso && ahora - this.ultimaBusquedaApi >= this.INTERVALO_MIN_API_MS) {
            try {
                const embedding = await this.faceHelper.obtenerEmbeddingFrame(video);
                if (embedding) {
                    this.busquedaApiEnCurso = true;
                    this.mensajeReconocimiento = 'Buscando...';
                    this.cdr.markForCheck();

                    const resultado = await this.faceHelper.buscarUsuarioPorEmbedding(embedding, []);
                    this.ultimaBusquedaApi = Date.now();
                    this.busquedaApiEnCurso = false;

                    if (resultado?.confiable) {
                        this.hitsConsecutivos++;
                        const pct = (resultado.similitudBackend * 100).toFixed(0);
                        this.mensajeReconocimiento = `Identificando... ${resultado.usuario.persona?.nombre} (${pct}%)`;
                        this.cdr.markForCheck();

                        if (this.hitsConsecutivos >= this.HITS_PARA_CONFIRMAR) {
                            this.detenerBusquedaContinua();
                            this.detecting = false;
                            this.mensajeReconocimiento = `✓ ${resultado.usuario.persona?.nombre} (${pct}%)`;
                            this.cdr.markForCheck();
                            video.pause();
                            this.camaraService.detenerCamara();
                            setTimeout(() => this.usuarioIdentificado.emit(resultado.usuario), 400);
                            return;
                        }
                    } else {
                        this.hitsConsecutivos = 0;
                        this.mensajeReconocimiento = 'Mire a la cámara para identificarse';
                    }
                } else {
                    this.hitsConsecutivos = 0;
                    this.mensajeReconocimiento = 'Centra tu rostro en la cámara';
                }
            } catch (e) {
                console.error('Error en búsqueda continua:', e);
                this.busquedaApiEnCurso = false;
                this.hitsConsecutivos = 0;
                this.mensajeReconocimiento = 'Error en la búsqueda. Reintentando...';
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
        this.camaraService.detenerCamara();
        await this.iniciarCamaraBusqueda();
    }

    onBusquedaManual(): void {
        this.busquedaManual.emit();
    }

    onCerrar(): void {
        this.limpiarEstados();
        this.camaraService.detenerCamara();
        this.cerrar.emit();
    }

    private async iniciarCamaraParaVerificacion(): Promise<void> {
        this.mensajeReconocimiento = 'Iniciando cámara...';
        this.livenessStep = 'BLINK';
        this.livenessInstruction = 'Parpadee para verificar';
        this.hasBlinked = false;
        this.cdr.detectChanges();

        try {
            const stream = await this.camaraService.iniciarCamara();
            await this.esperarVideoElement();

            if (this.videoElement) {
                const video = this.videoElement.nativeElement;
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play().catch(err => console.error('Error al reproducir:', err));
                    this.detecting = true;
                    this.bucleDeteccion();
                };
            } else {
                throw new Error('No se encontró el elemento de video');
            }
        } catch (e) {
            console.error('Error en iniciarCamaraParaVerificacion:', e);
            this.mensajeReconocimiento = 'Error al acceder a la cámara';
        }
        this.cdr.markForCheck();
    }

    private async bucleDeteccion(): Promise<void> {
        if (!this.detecting || !this.videoElement || !this.referenciaGaleria) return;

        const video = this.videoElement.nativeElement;
        if (video.paused || video.ended) {
            setTimeout(() => this.bucleDeteccion(), 100);
            return;
        }

        const resultado = await this.faceHelper.procesarFrame(video, this.referenciaGaleria);

        if (resultado.exito && resultado.embedding) {
            if (this.livenessStep === 'BLINK' && resultado.result) {
                const blinkGesture = resultado.result.gesture?.find((g: any) => g.gesture.toLowerCase().includes('blink'));
                const liveness = resultado.result.face?.[0]?.liveness;

                if (blinkGesture || (liveness !== undefined && liveness < 0.15)) {
                    this.hasBlinked = true;
                    this.livenessStep = 'DONE';
                    this.livenessInstruction = 'Verificación completa';
                }
            }

            if (this.livenessStep === 'DONE') {
                this.mensajeReconocimiento = '✓ Rostro verificado y parpadeo detectado';
                this.similitudInsuficiente.emit(false);
                this.embeddingCapturado = resultado.embedding;
                this.detecting = false;
                this.verificacionSnapshotUrl = this.camaraService.capturarFoto(video);
                video.pause();
                this.camaraService.detenerCamara();
                this.identidadVerificada.emit({ embedding: resultado.embedding, snapshotUrl: this.verificacionSnapshotUrl });
                this.cdr.markForCheck();
                return;
            } else {
                this.mensajeReconocimiento = this.livenessInstruction;
            }
        } else {
            this.mensajeReconocimiento = resultado.mensaje;
        }

        if (resultado.mensaje.includes('Similitud insuficiente')) {
            this.similitudInsuficiente.emit(true);
        } else if (resultado.mensaje.includes('No se detecta rostro')) {
            this.similitudInsuficiente.emit(false);
        }

        this.cdr.markForCheck();
        requestAnimationFrame(() => this.bucleDeteccion());
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

            const stream = await this.camaraService.iniciarCamara();
            await this.esperarVideoElement();
            await this.esperarVideoListo();

            if (this.videoElement) {
                const video = this.videoElement.nativeElement;
                video.srcObject = stream;
                await new Promise<void>((resolve) => {
                    video.onloadedmetadata = async () => {
                        await video.play().catch(err => console.error('Error playing video:', err));
                        resolve();
                    };
                });
                await this.esperarVideoListo();
            }
        } catch (e) {
            console.error('Error en capturaMultiple:', e);
            this.mensajeReconocimiento = 'No se pudo acceder a la cámara.';
            this.capturaMultiplePaso = 0;
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
                this.camaraService.detenerCamara();
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
        this.detecting = false;
        this.mensajeReconocimiento = '';
        this.embeddingCapturado = null;
        this.esperandoCapturaPerfil = false;
        this.capturaMultipleFotos = [];
        this.livenessStep = 'BLINK';
        this.livenessInstruction = 'Parpadee para verificar';
        this.hasBlinked = false;
    }

    private async esperarVideoElement(): Promise<void> {
        for (let i = 0; i < 5; i++) {
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
