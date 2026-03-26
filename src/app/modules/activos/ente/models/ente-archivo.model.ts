import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Ente } from './ente.model';
import { TipoArchivoEnte } from '../enums/tipo-archivo-ente.enum';

export interface EnteArchivo {
    id?: number;
    ente?: Ente;
    tipoArchivo?: TipoArchivoEnte;
    url?: string;
    descripcion?: string;
    vigente?: boolean;
    usuario?: Usuario;
    creadoEn?: Date;
}
