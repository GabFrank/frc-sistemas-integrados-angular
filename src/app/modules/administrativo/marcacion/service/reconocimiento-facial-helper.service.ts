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
    serializarGaleriaFacial
} from '../models/embedding-galeria.model';

export interface EstadoReconocimiento {
    exito: boolean;
    mensaje: string;
    embedding?: number[];
    mostrarCamara: boolean;
    result?: any;
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

    async procesarFrame(video: HTMLVideoElement, referenciaGaleria: EmbeddingGaleria): Promise<EstadoReconocimiento> {
        const detection = await this.faceService.detect(video);

        if (detection.face && detection.face.length > 0) {
            const tensor = Array.from(detection.face[0].embedding);
            const similarity = this.faceService.calcularMejorSimilitudConGaleria(tensor, referenciaGaleria);

            if (similarity > 0.55) {
                return {
                    exito: true,
                    mensaje: 'Rostro verificado',
                    embedding: tensor,
                    mostrarCamara: false,
                    result: detection
                };
            } else {
                return {
                    exito: false,
                    mensaje: `Rostro detectado. Similitud insuficiente (${(similarity * 100).toFixed(0)}%)`,
                    mostrarCamara: true,
                    result: detection
                };
            }
        } else {
            return {
                exito: false,
                mensaje: 'No se detecta rostro. Centra tu cara.',
                mostrarCamara: true,
                result: detection
            };
        }
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

    async obtenerEmbeddingFrame(video: HTMLVideoElement): Promise<number[] | null> {
        const detection = await this.faceService.detect(video);
        if (detection.face && detection.face.length > 0) {
            return Array.from(detection.face[0].embedding);
        }
        return null;
    }
  /** Identificación por embedding: solo backend (caché en memoria), sin segunda validación con foto de perfil. */
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
                confiable: similitudBackend > 0.55
            };
        } catch (error) {
            console.error('Error en búsqueda por embedding', error);
            return null;
        }
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
