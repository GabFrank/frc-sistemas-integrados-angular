import { Marca } from "./marca.model";
import { Usuario } from "../../../../personas/usuarios/usuario.model";

export interface Modelo {
    id?: number;
    descripcion?: string;
    marca?: Marca;
    usuario?: Usuario;
    creadoEn?: Date;
}
