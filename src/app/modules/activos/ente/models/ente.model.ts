import { Usuario } from '../../../personas/usuarios/usuario.model';
import { TipoEnte } from '../enums/tipo-ente.enum';

export interface Ente {
    id?: number;
    tipoEnte?: TipoEnte;
    referenciaId?: number;
    activo?: boolean;
    usuario?: Usuario;
    creadoEn?: Date;
}
