import { Usuario } from "../../personas/usuarios/usuario.model";

export class TipoPrecio {
    id: number;
    descripcion: string;
    autorizacion: boolean;
    activo: boolean;
    creadoEn: Date;
    usuario: Usuario;
}