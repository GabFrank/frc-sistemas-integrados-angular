import { Injectable } from '@angular/core';
import { FaceRecognitionService, DescriptorConScore } from './face-recognition.service';
import { CamaraService } from '../../../../shared/services/camara.service';
import { UsuarioService } from '../../../personas/usuarios/usuario.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { timeout } from 'rxjs/operators';
import {
    EmbeddingGaleria,
    construirGaleriaDesdeCapturas,
    parsearGaleriaFacial,
    serializarGaleriaFacial,
    FrameCalidadFacial,
    UMBRAL_SIMILITUD_FACIAL,
    SCORE_MINIMO_DETECCION,
    SCORE_MINIMO_FRAME,
    SCORE_MINIMO_FRAME_VERIFICACION,
    SCORE_MINIMO_GALERIA,
    FRAMES_MINIMOS_VERIFICACION,
    promediarEmbeddingsConScore,
    scorePromedioFrames
} from '../models/embedding-galeria.model';
import {
    IncorporarEmbeddingMarcacionResult,
    MENSAJE_ERROR_RED_CLIENTE,
    MENSAJE_RECHAZADO_SCORE_CLIENTE,
    ResultadoIncorporacionEmbeddingCliente
} from '../models/incorporar-embedding-result.model';

export interface EstadoReconocimiento {
    exito: boolean;
    mensaje: string;
    embedding?: number[];
    mostrarCamara: boolean;
    result?: any;
}

export interface ResultadoVerificacionFacial {
    embedding: number[];
    score: number;
    similitud: number;
    snapshotUrl: string;
}

export interface EvaluacionFrameVerificacion {
    calidadOk: boolean;
    rostroDetectado: boolean;
    similitud?: number;
    embedding?: number[];
    score?: number;
    mensaje: string;
    result?: any;
}

export interface EvaluacionFrameBusqueda {
    rostroDetectado: boolean;
    embedding?: number[];
    score?: number;
    mensaje: string;
}

export interface ResultadoBusqueda {
    usuario: Usuario;
    similitudBackend: number;
    similitudLocal: number;
    confiable: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ReconocimientoFacialHelperService {

    constructor(
        private faceService: FaceRecognitionService,
        private camaraService: CamaraService,
        private usuarioService: UsuarioService,
        private notificacionService: NotificacionSnackbarService
    ) { }

    async obtenerGaleriaReferencia(usuario: Usuario): Promise<EmbeddingGaleria | null> {
        return parsearGaleriaFacial(usuario?.persona?.embeddingFacial);
    }

    async inicializarMotorFacial(): Promise<void> {
        await this.faceService.init();
    }

    async procesarFrame(
        video: HTMLVideoElement,
        referenciaGaleria: EmbeddingGaleria,
        umbralSimilitud: number
    ): Promise<EstadoReconocimiento> {
        const evaluacion = await this.evaluarFrameVerificacion(video, referenciaGaleria, umbralSimilitud);
        if (evaluacion.calidadOk && evaluacion.embedding) {
            return {
                exito: true,
                mensaje: `Rostro verificado (${Math.round((evaluacion.similitud ?? 0) * 100)}%)`,
                embedding: evaluacion.embedding,
                mostrarCamara: false,
                result: evaluacion.result
            };
        }
        return {
            exito: false,
            mensaje: evaluacion.mensaje,
            mostrarCamara: true,
            result: evaluacion.result
        };
    }

    async evaluarFrameVerificacion(
        video: HTMLVideoElement,
        referenciaGaleria: EmbeddingGaleria,
        umbralSimilitud: number
    ): Promise<EvaluacionFrameVerificacion> {
        const detection = await this.faceService.detect(video);

        if (!detection.face || detection.face.length === 0) {
            return {
                calidadOk: false,
                rostroDetectado: false,
                mensaje: 'No se detecta rostro. Centra tu cara.',
                result: detection
            };
        }

        const face = detection.face[0];
        const score = this.resolverScoreRostro(face);
        const tensor = this.extraerEmbedding(face);

        if (!tensor) {
            return {
                calidadOk: false,
                rostroDetectado: true,
                score,
                mensaje: 'Procesando rostro, mantenga la posición...',
                result: detection
            };
        }

        const similarity = this.faceService.calcularMejorSimilitudConGaleria(tensor, referenciaGaleria);
        const pct = Math.round(similarity * 100);
        const umbralPct = Math.round(umbralSimilitud * 100);

        if (score < SCORE_MINIMO_DETECCION) {
            return {
                calidadOk: false,
                rostroDetectado: true,
                similitud: similarity,
                embedding: tensor,
                score,
                mensaje: `Rostro detectado (${pct}%). Acérquese con mejor iluminación.`,
                result: detection
            };
        }

        if (similarity < umbralSimilitud) {
            return {
                calidadOk: false,
                rostroDetectado: true,
                similitud: similarity,
                embedding: tensor,
                score,
                mensaje: `Similitud insuficiente (${pct}%). Se requiere al menos ${umbralPct}%.`,
                result: detection
            };
        }

        if (score < SCORE_MINIMO_FRAME_VERIFICACION) {
            return {
                calidadOk: false,
                rostroDetectado: true,
                similitud: similarity,
                embedding: tensor,
                score,
                mensaje: `Coincidencia ${pct}%. Mejore iluminación para confirmar.`,
                result: detection
            };
        }

        return {
            calidadOk: true,
            rostroDetectado: true,
            similitud: similarity,
            embedding: tensor,
            score,
            mensaje: `Identidad verificada (${pct}%)`,
            result: detection
        };
    }

    confirmarVerificacionFinal(
        frames: FrameCalidadFacial[],
        referenciaGaleria: EmbeddingGaleria,
        umbralSimilitud: number
    ): { embedding: number[]; score: number; similitud: number } | null {
        const framesValidos = frames.filter(
            (f) =>
                f.embedding?.length > 0 &&
                f.score >= SCORE_MINIMO_FRAME_VERIFICACION &&
                (f.similitud == null || f.similitud >= umbralSimilitud)
        );
        if (framesValidos.length < FRAMES_MINIMOS_VERIFICACION) {
            return null;
        }

        const embedding = promediarEmbeddingsConScore(framesValidos);
        if (!embedding) {
            return null;
        }

        const similitudFinal = this.faceService.calcularMejorSimilitudConGaleria(embedding, referenciaGaleria);
        if (similitudFinal < umbralSimilitud) {
            return null;
        }

        const similitudPromedio =
            framesValidos.reduce((sum, f) => sum + (f.similitud ?? 0), 0) / framesValidos.length;
        if (similitudPromedio < umbralSimilitud) {
            return null;
        }

        return {
            embedding,
            score: scorePromedioFrames(framesValidos),
            similitud: similitudFinal
        };
    }

    embeddingCumpleUmbralVerificacion(
        embedding: number[],
        referenciaGaleria: EmbeddingGaleria,
        umbralSimilitud: number
    ): boolean {
        if (!embedding?.length || !referenciaGaleria) {
            return false;
        }
        return this.faceService.calcularMejorSimilitudConGaleria(embedding, referenciaGaleria) >= umbralSimilitud;
    }

    async evaluarFrameBusqueda(video: HTMLVideoElement): Promise<EvaluacionFrameBusqueda> {
        const detection = await this.faceService.detect(video);

        if (!detection.face || detection.face.length === 0) {
            return {
                rostroDetectado: false,
                mensaje: 'Centra tu rostro en la cámara'
            };
        }

        const face = detection.face[0];
        const score = this.resolverScoreRostro(face);
        const embedding = this.extraerEmbedding(face);

        if (!embedding) {
            return {
                rostroDetectado: true,
                score,
                mensaje: 'Procesando rostro, espere un momento...'
            };
        }

        if (score < SCORE_MINIMO_DETECCION) {
            return {
                rostroDetectado: true,
                embedding,
                score,
                mensaje: 'Rostro detectado. Acérquese con mejor iluminación.'
            };
        }

        return {
            rostroDetectado: true,
            embedding,
            score,
            mensaje: 'Rostro detectado, buscando...'
        };
    }

    construirEmbeddingVerificado(frames: FrameCalidadFacial[]): { embedding: number[]; score: number } | null {
        const embedding = promediarEmbeddingsConScore(frames);
        if (!embedding) {
            return null;
        }
        return {
            embedding,
            score: scorePromedioFrames(frames)
        };
    }

    async actualizarGaleriaPostMarcacion(
        usuarioId: number,
        embedding: number[],
        score: number
    ): Promise<void> {
        if (!usuarioId || !embedding?.length) {
            return;
        }

        if (score < SCORE_MINIMO_GALERIA) {
            this.notificarResultadoIncorporacion({
                resultado: 'RECHAZADO_SCORE',
                mensaje: MENSAJE_RECHAZADO_SCORE_CLIENTE
            });
            return;
        }

        try {
            const resultado = await this.usuarioService.onIncorporarEmbeddingMarcacion(usuarioId, embedding, score, true)
                .pipe(timeout(8000))
                .toPromise();
            this.notificarResultadoIncorporacion(this.normalizarResultadoIncorporacion(resultado));
        } catch (error) {
            console.warn('No se pudo enriquecer la galería facial tras marcación', error);
            this.notificarResultadoIncorporacion({
                resultado: 'ERROR_RED',
                mensaje: MENSAJE_ERROR_RED_CLIENTE
            });
        }
    }

    private normalizarResultadoIncorporacion(resultado: unknown): {
        resultado: ResultadoIncorporacionEmbeddingCliente;
        mensaje: string;
    } {
        if (resultado == null) {
            return {
                resultado: 'ERROR_RED',
                mensaje: MENSAJE_ERROR_RED_CLIENTE
            };
        }
        if (typeof resultado === 'boolean') {
            return resultado
                ? { resultado: 'OK', mensaje: 'Perfil facial actualizado con esta marcación.' }
                : { resultado: 'RECHAZADO_SCORE', mensaje: MENSAJE_RECHAZADO_SCORE_CLIENTE };
        }
        const payload = resultado as IncorporarEmbeddingMarcacionResult;
        return {
            resultado: payload.resultado ?? 'ERROR_RED',
            mensaje: payload.mensaje || MENSAJE_ERROR_RED_CLIENTE
        };
    }

    private notificarResultadoIncorporacion(resultado: {
        resultado: ResultadoIncorporacionEmbeddingCliente;
        mensaje: string;
    }): void {
        const color = resultado.resultado === 'OK'
            ? NotificacionColor.info
            : resultado.resultado === 'ERROR_RED'
                ? NotificacionColor.danger
                : NotificacionColor.warn;

        this.notificacionService.notification$.next({
            texto: resultado.mensaje,
            color,
            duracion: 3
        });
    }

    async buscarYValidarUsuario(embedding: number[]): Promise<ResultadoBusqueda | null> {
        try {
            const resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, [], true)
                .pipe(timeout(10000))
                .toPromise();
            if (!resultado?.usuario) {
                return null;
            }

            const usuario: Usuario = resultado.usuario;
            const similitudBackend: number = resultado.similitud;
            const galeriaPerfil = parsearGaleriaFacial(usuario.persona?.embeddingFacial);

            if (!galeriaPerfil) {
                return {
                    usuario,
                    similitudBackend,
                    similitudLocal: 0,
                    confiable: false
                };
            }

            const similitudLocal = this.faceService.calcularMejorSimilitudConGaleria(embedding, galeriaPerfil);

            return {
                usuario,
                similitudBackend,
                similitudLocal,
                confiable: similitudBackend > 0.55 && similitudLocal > 0.55
            };
        } catch (error) {
            console.error('Error en búsqueda y validación de usuario', error);
            return null;
        }
    }

    async buscarUsuarioPorEmbedding(embedding: number[], excludeIds: number[] = []): Promise<ResultadoBusqueda | null> {
        try {
            const resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, excludeIds, true)
                .pipe(timeout(5000))
                .toPromise();

            if (!resultado?.usuario) {
                return null;
            }

            const similitudBackend: number = resultado.similitud ?? 0;
            return {
                usuario: resultado.usuario,
                similitudBackend,
                similitudLocal: similitudBackend,
                confiable: similitudBackend >= UMBRAL_SIMILITUD_FACIAL
            };
        } catch (error) {
            console.error('Error en búsqueda por embedding', error);
            return null;
        }
    }

    private extraerEmbedding(face: { embedding?: ArrayLike<number> }): number[] | null {
        if (!face?.embedding) {
            return null;
        }
        const embedding = Array.from(face.embedding);
        return embedding.length > 0 ? embedding : null;
    }

    private resolverScoreRostro(face: { score?: number; boxScore?: number }): number {
        const score = face.score ?? face.boxScore;
        return score != null && score > 0 ? score : 0.6;
    }

    async capturarFrameConScore(
        videoElement: HTMLVideoElement
    ): Promise<{ imageBase64: string; embedding: number[]; score: number } | null> {
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            return null;
        }

        const imageBase64 = this.camaraService.capturarFoto(videoElement);
        if (!imageBase64) {
            return null;
        }

        const resultado = await this.faceService.getDescriptorConScoreDesdeImagen(imageBase64);
        if (!resultado) {
            return null;
        }

        return {
            imageBase64,
            embedding: resultado.embedding,
            score: resultado.score
        };
    }

    async guardarFotoPerfilConEmbeddingMaestro(
        usuarioId: number,
        imagenFrontalBase64: string,
        capturas: Array<{ imageBase64: string; embedding: number[]; score: number }>
    ): Promise<boolean> {
        const galeria = construirGaleriaDesdeCapturas(capturas);
        if (!galeria) {
            this.notificacionService.notification$.next({
                texto: 'Las fotos no tienen calidad suficiente para guardar el perfil facial',
                color: NotificacionColor.danger,
                duracion: 3
            });
            return false;
        }

        try {
            await this.usuarioService.onSaveUsuarioImage(
                usuarioId,
                'perfil',
                imagenFrontalBase64,
                galeria.master,
                true,
                serializarGaleriaFacial(galeria)
            ).toPromise();

            this.notificacionService.notification$.next({
                texto: 'Foto de perfil actualizada correctamente',
                color: NotificacionColor.success,
                duracion: 3
            });
            return true;
        } catch (error) {
            this.notificacionService.notification$.next({
                texto: 'Error al guardar la foto de perfil',
                color: NotificacionColor.danger,
                duracion: 3
            });
            return false;
        }
    }
}
