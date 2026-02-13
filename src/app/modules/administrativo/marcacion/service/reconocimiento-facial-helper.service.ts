import { Injectable } from '@angular/core';
import { FaceRecognitionService } from './face-recognition.service';
import { CamaraService } from '../../../../shared/services/camara.service';
import { UsuarioService } from '../../../personas/usuarios/usuario.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { Usuario } from '../../../personas/usuarios/usuario.model';

export interface EstadoReconocimiento {
    exito: boolean;
    mensaje: string;
    embedding?: number[];
    mostrarCamara: boolean;
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

    async obtenerDescriptorReferencia(fotoUrl: string): Promise<number[] | null> {
        try {
            return await this.faceService.getDescriptor(fotoUrl);
        } catch (error) {
            console.error('Error al obtener descriptor de referencia', error);
            return null;
        }
    }

    async procesarFrame(video: HTMLVideoElement, referenciaDescriptor: number[]): Promise<EstadoReconocimiento> {
        const detection = await this.faceService.detect(video);

        if (detection.face && detection.face.length > 0) {
            const tensor = Array.from(detection.face[0].embedding);
            const similarity = this.faceService.similarity(referenciaDescriptor, tensor);

            if (similarity > 0.6) {
                return {
                    exito: true,
                    mensaje: 'Rostro verificado',
                    embedding: tensor,
                    mostrarCamara: false
                };
            } else {
                return {
                    exito: false,
                    mensaje: `Rostro detectado. Similitud insuficiente (${(similarity * 100).toFixed(0)}%)`,
                    mostrarCamara: true
                };
            }
        } else {
            return {
                exito: false,
                mensaje: 'No se detecta rostro. Centra tu cara.',
                mostrarCamara: true
            };
        }
    }

    async capturarYGuardarFotoPerfil(usuarioId: number, videoElement: HTMLVideoElement): Promise<boolean> {
        const detection = await this.faceService.detect(videoElement);

        if (detection.face && detection.face.length > 0) {
            const tensor = Array.from(detection.face[0].embedding);
            const imageBase64 = this.camaraService.capturarFoto(videoElement);
            this.camaraService.detenerCamara();

            try {
                await this.usuarioService.onSaveUsuarioImage(
                    usuarioId,
                    'perfil',
                    imageBase64,
                    tensor,
                    false
                ).toPromise();

                this.notificacionService.notification$.next({
                    texto: 'Foto de perfil guardada exitosamente',
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
        return false;
    }
    async buscarYValidarUsuario(embedding: number[], video: HTMLVideoElement): Promise<ResultadoBusqueda | null> {
        try {
            const resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding).toPromise();
            if (!resultado || !resultado.usuario) {
                return null;
            }

            const usuario: Usuario = resultado.usuario;
            const similitudBackend: number = resultado.similitud;

            const fotoUrl = await this.obtenerFotoPerfilUsuario(usuario);
            if (!fotoUrl) {
                console.warn('Usuario sin foto de perfil, confiando solo en backend');
                return {
                    usuario,
                    similitudBackend,
                    similitudLocal: 0,
                    confiable: similitudBackend > 0.85 // Más estricto sin doble validación
                };
            }

            // Obtener embedding de la foto de perfil
            const descriptorPerfil = await this.obtenerDescriptorReferencia(fotoUrl);
            if (!descriptorPerfil) {
                console.warn('No se pudo obtener descriptor de foto de perfil');
                return {
                    usuario,
                    similitudBackend,
                    similitudLocal: 0,
                    confiable: similitudBackend > 0.85
                };
            }
            const similitudLocal = this.faceService.similarity(embedding, descriptorPerfil);
            console.log(`Doble validación - Backend: ${(similitudBackend * 100).toFixed(1)}%, Local: ${(similitudLocal * 100).toFixed(1)}%`);

            return {
                usuario,
                similitudBackend,
                similitudLocal,
                confiable: similitudBackend > 0.75 && similitudLocal > 0.5
            };
        } catch (error) {
            console.error('Error en búsqueda y validación de usuario', error);
            return null;
        }
    }
    private async obtenerFotoPerfilUsuario(usuario: Usuario): Promise<string | null> {
        if (!usuario.persona?.imagenes) return null;
        try {
            const images = await this.usuarioService.onGetUsuarioImages(
                usuario.id, 'perfil', true,
                { networkError: { propagate: true, show: false } }
            ).toPromise();
            if (images && images.length > 0) return images[0];

            // Fallback local
            const localImages = await this.usuarioService.onGetUsuarioImages(usuario.id, 'perfil', false).toPromise();
            if (localImages && localImages.length > 0) return localImages[0];
        } catch (e) {
            try {
                const localImages = await this.usuarioService.onGetUsuarioImages(usuario.id, 'perfil', false).toPromise();
                if (localImages && localImages.length > 0) return localImages[0];
            } catch (e2) {
                console.error('Error obteniendo foto de perfil', e2);
            }
        }
        return null;
    }

    async obtenerEmbeddingFrame(video: HTMLVideoElement): Promise<number[] | null> {
        const detection = await this.faceService.detect(video);
        if (detection.face && detection.face.length > 0) {
            return Array.from(detection.face[0].embedding);
        }
        return null;
    }
    async buscarUsuarioPorEmbedding(embedding: number[], excludeIds: number[] = []): Promise<ResultadoBusqueda | null> {
        try {
            const resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, excludeIds).toPromise();
            if (!resultado || !resultado.usuario) {
                return null;
            }

            const usuario: Usuario = resultado.usuario;
            const similitudBackend: number = resultado.similitud;
            const fotoUrl = await this.obtenerFotoPerfilUsuario(usuario);
            if (!fotoUrl) {
                return {
                    usuario,
                    similitudBackend,
                    similitudLocal: 0,
                    confiable: similitudBackend > 0.85
                };
            }

            const descriptorPerfil = await this.obtenerDescriptorReferencia(fotoUrl);
            if (!descriptorPerfil) {
                return {
                    usuario,
                    similitudBackend,
                    similitudLocal: 0,
                    confiable: similitudBackend > 0.85
                };
            }

            const similitudLocal = this.faceService.similarity(embedding, descriptorPerfil);
            console.log(`Búsqueda snapshot - Backend: ${(similitudBackend * 100).toFixed(1)}%, Local: ${(similitudLocal * 100).toFixed(1)}%`);

            return {
                usuario,
                similitudBackend,
                similitudLocal,
                confiable: similitudBackend > 0.75 && similitudLocal > 0.5
            };
        } catch (error) {
            console.error('Error en búsqueda por embedding', error);
            return null;
        }
    }
}
