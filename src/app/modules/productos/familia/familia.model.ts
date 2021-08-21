import { Usuario } from "../../personas/usuarios/usuario.model";
import { Subfamilia } from "../sub-familia/sub-familia.model";

export class Familia {
    id:number;
    nombre: string;
    descripcion: String;
    activo: Boolean;
    subfamilias: Subfamilia[]
    creadoEn: Date;
    usuario: Usuario;
    icono: String;
    posicion: number;
}