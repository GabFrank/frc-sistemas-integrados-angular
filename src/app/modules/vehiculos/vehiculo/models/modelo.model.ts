import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Marca } from './marca.model';

export interface Modelo {
    id?: number;
    descripcion?: string;
    marca?: Marca;
    usuario?: Usuario;
    creadoEn?: Date;
}
