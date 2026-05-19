import { Usuario } from "../../../../personas/usuarios/usuario.model";

export interface Marca {
    id?: number;
    descripcion?: string;
    usuario?: Usuario;
    creadoEn?: Date;
}
