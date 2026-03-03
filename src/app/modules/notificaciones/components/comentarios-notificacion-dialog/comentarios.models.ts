import { NotificacionComentario } from '../../graphql/comentariosNotificacion.gql';
import { TipoMedia } from '../../../../shared/services/media-type.service';

export interface ComentariosDialogData {
    notificacionId: number;
    notificacion: {
        id: number;
        titulo: string;
    };
    comentarioId?: number;
}
export interface UsuarioExtendido {
    id: number;
    nickname: string;
    persona?: { id: number; nombre: string; imagenes?: string };
    initials: string;
    color: string;
    color2: string;
    avatarUrl: string;
}
export interface ComentarioExtendido extends NotificacionComentario {
    initials: string;
    color: string;
    color2: string;
    lightColor: string;
    formattedText: string;
    isSameAuthor: boolean;
    replyColor?: string;
    replyLightColor?: string;
    avatarUrl: string;
    mediaUrl?: string;
    tipoMedia: TipoMedia;
    nombreArchivo: string;
}
