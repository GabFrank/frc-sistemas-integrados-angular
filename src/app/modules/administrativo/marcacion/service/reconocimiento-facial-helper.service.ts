import { Injectable } from '@angular/core';
import { FaceRecognitionService, DescriptorConScore } from './face-recognition.service';
import { CamaraService } from '../../../../shared/services/camara.service';
import { UsuarioService } from '../../../personas/usuarios/usuario.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
            let resultado: any = null;
            try {
                resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, [], true)
                    .pipe(
                        timeout(5000),
                        catchError(err => {
                            console.warn('Servidor central no disponible, usando servidor local para validación facial', err?.message || err);
                            return this.usuarioService.onGetUsuarioPorEmbedding(embedding, [], false);
                        })
                    ).toPromise();
            } catch (e) {
                console.warn('Fallback a servidor local para validación facial');
                resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, [], false).toPromise();
            }
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
                    confiable: similitudBackend > 0.85
                };
            }
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
            let resultado: any = null;
            try {
                resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, excludeIds, true)
                    .pipe(
                        timeout(5000),
                        catchError(err => {
                            console.warn('Servidor central no disponible, usando servidor local para búsqueda facial', err?.message || err);
                            return this.usuarioService.onGetUsuarioPorEmbedding(embedding, excludeIds, false);
                        })
                    ).toPromise();
            } catch (e) {
                console.warn('Fallback a servidor local para búsqueda facial');
                resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, excludeIds, false).toPromise();
            }

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
    async capturarFrameConScore(
        videoElement: HTMLVideoElement
    ): Promise<{ imageBase64: string; embedding: number[]; score: number } | null> {
        const resultado = await this.faceService.getDescriptorConScore(videoElement);
        if (!resultado) return null;

        const imageBase64 = this.camaraService.capturarFoto(videoElement);
        return {
            imageBase64,
            embedding: resultado.embedding,
            score: resultado.score
        };
    }

    /**
     * Fusiona múltiples embeddings promediando componente a componente.
     * Filtra los embeddings con score inferior al umbral mínimo.
     * @param capturas Array de { embedding, score }
     * @param scoreMinimo Umbral mínimo de score (default 0.5)
     * @returns Embedding maestro promediado o null si no hay embeddings válidos
     */
    fusionarEmbeddings(
        capturas: Array<{ embedding: number[]; score: number }>,
        scoreMinimo: number = 0.5
    ): number[] | null {
        const validas = capturas.filter(c => c.score >= scoreMinimo);
        console.log(`Fusión de embeddings: ${capturas.length} capturas, ${validas.length} válidas (umbral: ${scoreMinimo})`);

        capturas.forEach((c, i) => {
            console.log(`  Captura ${i + 1}: score=${c.score.toFixed(4)} ${c.score < scoreMinimo ? '(DESCARTADA)' : '(OK)'}`);
        });

        if (validas.length === 0) {
            console.warn('No hay capturas con score suficiente para fusionar');
            return null;
        }

        const dim = validas[0].embedding.length;
        const promedio = new Array(dim).fill(0);

        for (const captura of validas) {
            for (let i = 0; i < dim; i++) {
                promedio[i] += captura.embedding[i];
            }
        }

        for (let i = 0; i < dim; i++) {
            promedio[i] /= validas.length;
        }
        const magnitud = Math.sqrt(promedio.reduce((sum, val) => sum + val * val, 0));
        if (magnitud > 0) {
            for (let i = 0; i < dim; i++) {
                promedio[i] /= magnitud;
            }
        }

        console.log(`Embedding maestro generado y normalizado con ${validas.length} vectores`);
        return promedio;
    }
    async guardarFotoPerfilConEmbeddingMaestro(
        usuarioId: number,
        imagenFrontalBase64: string,
        embeddingMaestro: number[]
    ): Promise<boolean> {
        try {
            await this.usuarioService.onSaveUsuarioImage(
                usuarioId,
                'perfil',
                imagenFrontalBase64,
                embeddingMaestro,
                false
            ).toPromise();

            this.notificacionService.notification$.next({
                texto: 'Foto de perfil guardada con embedding mejorado',
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
