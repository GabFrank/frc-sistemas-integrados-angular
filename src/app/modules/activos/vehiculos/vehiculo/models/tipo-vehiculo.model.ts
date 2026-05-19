import { Usuario } from "../../../../personas/usuarios/usuario.model";

export interface TipoVehiculo {
    id?: number;
    descripcion?: string;
    usuario?: Usuario;
    creadoEn?: Date;
}
