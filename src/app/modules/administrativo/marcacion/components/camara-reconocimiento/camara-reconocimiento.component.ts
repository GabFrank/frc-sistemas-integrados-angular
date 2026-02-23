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
    @Input() referenciaDescriptor: number[] | null = null;
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
    fotoCapturada = false;
    snapshotDataUrl: string | null = null;
    verificacionSnapshotUrl: string | null = null;
    buscandoAutomaticamente = false;
    intentosBusqueda = 0;
    maxIntentosBusqueda = 10;
    countdownSegundos = 0;

    capturaMultiplePaso = 0;
    capturaMultipleFotos: Array<{ imageBase64: string; embedding: number[]; score: number }> = [];
    capturaMultipleMensajes = [
        '',
        'Paso 1/3: Gire su rostro ligeramente a la IZQUIERDA',
        'Paso 2/3: Gire su rostro ligeramente a la DERECHA',
        'Paso 3/3: Mire de FRENTE a la cámara'
    ];

    esperandoCapturaPerfil = false;

    private snapshotEmbedding: number[] | null = null;
    private embeddingCapturado: number[] | null = null;
    private countdownInterval: any;
    private autoSearchInterval: any;
    private excludedUserIds: number[] = [];
    private lastCheckTime = 0;

    constructor(
        private cdr: ChangeDetectorRef,
        private camaraService: CamaraService,
        private faceHelper: ReconocimientoFacialHelperService
    ) { }

    ngOnDestroy(): void {
        this.detenerCountdown();
        this.detenerAutoSearch();
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
                await this.iniciarCapturaPerfil();
                break;
            case 'captura-multiple':
                await this.iniciarCapturaMultiple();
                break;
        }
    }

    private async iniciarCamaraBusqueda(): Promise<void> {
        this.limpiarEstados();
        this.fotoCapturada = false;
        this.snapshotDataUrl = null;
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
            this.iniciarCountdown(3);
            this.cdr.markForCheck();
        } catch (e) {
            console.error('Error en iniciarCamaraBusqueda:', e);
            this.mensajeReconocimiento = 'Error al acceder a la cámara.';
            this.detecting = false;
            this.camaraService.detenerCamara();
            this.cdr.markForCheck();
        }
    }

    private iniciarCountdown(segundos: number): void {
        this.countdownSegundos = segundos;
        this.mensajeReconocimiento = `Captura automática en ${this.countdownSegundos}s - Posicione su rostro`;
        this.cdr.markForCheck();

        this.countdownInterval = setInterval(() => {
            this.countdownSegundos--;
            if (this.countdownSegundos <= 0) {
                this.detenerCountdown();
                this.capturarSnapshotAutomatico();
            } else {
                this.mensajeReconocimiento = `Captura automática en ${this.countdownSegundos}s - Posicione su rostro`;
                this.cdr.markForCheck();
            }
        }, 1000);
    }

    private detenerCountdown(): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    private detenerAutoSearch(): void {
        this.buscandoAutomaticamente = false;
        if (this.autoSearchInterval) {
            clearTimeout(this.autoSearchInterval);
            this.autoSearchInterval = null;
        }
    }

    async capturarSnapshotAutomatico(): Promise<void> {
        if (!this.videoElement) return;
        const video = this.videoElement.nativeElement;

        this.snapshotDataUrl = this.camaraService.capturarFoto(video);
        video.pause();
        this.fotoCapturada = true;
        this.detecting = true;
        this.mensajeReconocimiento = 'Foto capturada. Analizando rostro...';
        this.cdr.markForCheck();

        this.camaraService.detenerCamara();

        try {
            this.snapshotEmbedding = await this.faceHelper.obtenerDescriptorReferencia(this.snapshotDataUrl);

            if (!this.snapshotEmbedding) {
                this.mensajeReconocimiento = 'No se detectó rostro en la foto. Intente nuevamente.';
                this.detecting = false;
                this.cdr.markForCheck();
                return;
            }
            this.iniciarBusquedaAutomatica();
        } catch (e) {
            console.error('Error al procesar snapshot:', e);
            this.mensajeReconocimiento = 'Error al procesar la captura.';
            this.detecting = false;
            this.cdr.markForCheck();
        }
    }

    private async iniciarBusquedaAutomatica(): Promise<void> {
        if (!this.snapshotEmbedding || !this.fotoCapturada) return;
        this.buscandoAutomaticamente = true;
        this.intentosBusqueda = 0;
        this.ejecutarBusquedaConSnapshot();
    }

    private async ejecutarBusquedaConSnapshot(): Promise<void> {
        if (!this.buscandoAutomaticamente || !this.snapshotEmbedding) return;

        this.intentosBusqueda++;
        this.detecting = true;
        this.mensajeReconocimiento = `Buscando persona... (intento ${this.intentosBusqueda}/${this.maxIntentosBusqueda})`;
        this.cdr.markForCheck();

        try {
            const resultado = await this.faceHelper.buscarUsuarioPorEmbedding(this.snapshotEmbedding, this.excludedUserIds);

            if (resultado && resultado.confiable) {
                this.buscandoAutomaticamente = false;
                const pct = (resultado.similitudBackend * 100).toFixed(0);
                this.mensajeReconocimiento = `✓ Identificado: ${resultado.usuario.persona?.nombre} (${pct}%)`;
                this.detecting = false;
                this.cdr.markForCheck();

                setTimeout(() => {
                    this.usuarioIdentificado.emit(resultado.usuario);
                }, 1200);
                return;
            }

            if (resultado && !resultado.confiable) {
                const userId = resultado.usuario.id;
                this.excludedUserIds.push(userId);
                this.mensajeReconocimiento = `${resultado.usuario.persona?.nombre} descartado. Buscando siguiente...`;
                this.cdr.markForCheck();

                if (this.intentosBusqueda < this.maxIntentosBusqueda) {
                    this.autoSearchInterval = setTimeout(() => {
                        this.ejecutarBusquedaConSnapshot();
                    }, 500);
                    return;
                }
            }

            if (this.intentosBusqueda >= this.maxIntentosBusqueda || !resultado) {
                this.buscandoAutomaticamente = false;
                this.detecting = false;
                this.mensajeReconocimiento = 'No se encontró coincidencia. Intente con nueva foto.';
                this.cdr.markForCheck();
                return;
            }

            this.mensajeReconocimiento = `Sin coincidencia. Reintentando... (${this.intentosBusqueda}/${this.maxIntentosBusqueda})`;
            this.cdr.markForCheck();

            this.autoSearchInterval = setTimeout(() => {
                this.ejecutarBusquedaConSnapshot();
            }, 3000);

        } catch (e) {
            console.error('Error en búsqueda automática:', e);
            this.buscandoAutomaticamente = false;
            this.detecting = false;
            this.mensajeReconocimiento = 'Error en la búsqueda. Intente nuevamente.';
            this.cdr.markForCheck();
        }
    }

    detenerAutoSearchPublic(): void {
        this.detenerAutoSearch();
        this.detecting = false;
        this.mensajeReconocimiento = 'Búsqueda detenida. Intente con nueva foto.';
        this.cdr.markForCheck();
    }

    async retomarCamara(): Promise<void> {
        this.detenerAutoSearch();
        this.fotoCapturada = false;
        this.snapshotDataUrl = null;
        this.snapshotEmbedding = null;
        this.detecting = false;
        this.intentosBusqueda = 0;
        this.excludedUserIds = [];
        this.cdr.markForCheck();

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
        if (!this.detecting || !this.videoElement || !this.referenciaDescriptor) return;

        const video = this.videoElement.nativeElement;
        if (video.paused || video.ended) {
            setTimeout(() => this.bucleDeteccion(), 100);
            return;
        }

        const resultado = await this.faceHelper.procesarFrame(video, this.referenciaDescriptor);

        this.mensajeReconocimiento = resultado.mensaje;

        if (resultado.exito && resultado.embedding) {
            this.similitudInsuficiente.emit(false);
            this.embeddingCapturado = resultado.embedding;
            this.detecting = false;
            this.verificacionSnapshotUrl = this.camaraService.capturarFoto(video);
            video.pause();
            this.camaraService.detenerCamara();
            this.identidadVerificada.emit({ embedding: resultado.embedding, snapshotUrl: this.verificacionSnapshotUrl });
            this.cdr.markForCheck();
            return;
        }

        if (resultado.mensaje.includes('Similitud insuficiente')) {
            this.similitudInsuficiente.emit(true);
        } else if (resultado.mensaje.includes('No se detecta rostro')) {
            this.similitudInsuficiente.emit(false); // Reset if face is lost
        }

        this.cdr.markForCheck();
        requestAnimationFrame(() => this.bucleDeteccion());
    }
    private async iniciarCapturaPerfil(): Promise<void> {
        this.esperandoCapturaPerfil = true;
        this.mensajeReconocimiento = 'Posicione su rostro y presione "Guardar Foto"';
        this.cdr.detectChanges();

        try {
            const stream = await this.camaraService.iniciarCamara();
            await this.esperarVideoElement();

            if (this.videoElement) {
                const video = this.videoElement.nativeElement;
                video.srcObject = stream;
                await new Promise<void>((resolve) => {
                    video.onloadedmetadata = async () => {
                        await video.play().catch(err => console.error('Error playing video:', err));
                        resolve();
                    };
                });
            }
            this.cdr.markForCheck();
        } catch (e) {
            console.error('Error en capturaPerfil:', e);
            this.mensajeReconocimiento = 'No se pudo acceder a la cámara.';
            this.esperandoCapturaPerfil = false;
            this.cdr.markForCheck();
        }
    }

    async tomarFotoPerfil(): Promise<void> {
        if (!this.videoElement || !this.usuarioSeleccionado) return;

        const video = this.videoElement.nativeElement;
        this.esperandoCapturaPerfil = false;
        this.detecting = true;
        this.mensajeReconocimiento = 'Capturando foto...';
        this.cdr.markForCheck();

        const exito = await this.faceHelper.capturarYGuardarFotoPerfil(this.usuarioSeleccionado.id, video);
        this.detecting = false;

        if (exito) {
            this.camaraService.detenerCamara();
            this.fotoPerfilGuardada.emit();
        } else {
            this.esperandoCapturaPerfil = true;
            this.mensajeReconocimiento = 'Posicione su rostro y presione "Guardar Foto"';
            this.cdr.markForCheck();
        }
    }
    private async iniciarCapturaMultiple(): Promise<void> {
        this.capturaMultiplePaso = 1;
        this.capturaMultipleFotos = [];
        this.mensajeReconocimiento = this.capturaMultipleMensajes[1];
        this.cdr.detectChanges();

        try {
            const stream = await this.camaraService.iniciarCamara();
            await this.esperarVideoElement();

            if (this.videoElement) {
                const video = this.videoElement.nativeElement;
                video.srcObject = stream;
                await new Promise<void>((resolve) => {
                    video.onloadedmetadata = async () => {
                        await video.play().catch(err => console.error('Error playing video:', err));
                        resolve();
                    };
                });
            }
            this.cdr.markForCheck();
        } catch (e) {
            console.error('Error en capturaMultiple:', e);
            this.mensajeReconocimiento = 'No se pudo acceder a la cámara.';
            this.capturaMultiplePaso = 0;
            this.cdr.markForCheck();
        }
    }

    async tomarFotoPerfilMultiple(): Promise<void> {
        if (!this.videoElement || !this.usuarioSeleccionado || this.capturaMultiplePaso === 0) return;

        const video = this.videoElement.nativeElement;
        this.detecting = true;
        this.mensajeReconocimiento = 'Capturando foto...';
        this.cdr.markForCheck();

        const resultado = await this.faceHelper.capturarFrameConScore(video);
        this.detecting = false;

        if (!resultado) {
            this.mensajeReconocimiento = `No se detectó rostro. ${this.capturaMultipleMensajes[this.capturaMultiplePaso]}`;
            this.cdr.markForCheck();
            return;
        }

        this.capturaMultipleFotos.push(resultado);

        if (this.capturaMultiplePaso < 3) {
            this.capturaMultiplePaso++;
            this.mensajeReconocimiento = this.capturaMultipleMensajes[this.capturaMultiplePaso];
            this.cdr.markForCheck();
            return;
        }

        this.mensajeReconocimiento = 'Procesando embedding maestro...';
        this.cdr.markForCheck();

        const embeddingMaestro = this.faceHelper.fusionarEmbeddings(this.capturaMultipleFotos);
        if (!embeddingMaestro) {
            this.mensajeReconocimiento = 'Las fotos capturadas no tienen calidad suficiente. Intente de nuevo.';
            this.capturaMultiplePaso = 1;
            this.capturaMultipleFotos = [];
            this.cdr.markForCheck();
            return;
        }

        const fotoFrontal = this.capturaMultipleFotos[this.capturaMultipleFotos.length - 1].imageBase64;
        const exito = await this.faceHelper.guardarFotoPerfilConEmbeddingMaestro(
            this.usuarioSeleccionado.id,
            fotoFrontal,
            embeddingMaestro
        );

        if (exito) {
            this.camaraService.detenerCamara();
            this.capturaMultiplePaso = 0;
            this.capturaMultipleFotos = [];
            this.cdr.markForCheck();
            this.fotoPerfilGuardada.emit();
        } else {
            this.capturaMultiplePaso = 1;
            this.capturaMultipleFotos = [];
            this.mensajeReconocimiento = this.capturaMultipleMensajes[1];
            this.cdr.markForCheck();
        }
    }
    private limpiarEstados(): void {
        this.detecting = false;
        this.mensajeReconocimiento = '';
        this.fotoCapturada = false;
        this.snapshotDataUrl = null;
        this.snapshotEmbedding = null;
        this.embeddingCapturado = null;
        this.buscandoAutomaticamente = false;
        this.intentosBusqueda = 0;
        this.countdownSegundos = 0;
        this.excludedUserIds = [];
        this.esperandoCapturaPerfil = false;
        this.capturaMultiplePaso = 0;
        this.capturaMultipleFotos = [];
        this.detenerCountdown();
        this.detenerAutoSearch();
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
}
