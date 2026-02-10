import { Injectable } from '@angular/core';
import { FaceRecognitionService } from './face-recognition.service';
import { CamaraService } from '../../../../shared/services/camara.service';
import { UsuarioService } from '../../../personas/usuarios/usuario.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';

export interface EstadoReconocimiento {
    exito: boolean;
    mensaje: string;
    embedding?: number[];
    mostrarCamara: boolean;
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
            const imageBase64 = this.camaraService.capturarFoto(videoElement);
            this.camaraService.detenerCamara();

            try {
                await this.usuarioService.onSaveUsuarioImage(
                    usuarioId,
                    'perfil',
                    imageBase64,
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
}
