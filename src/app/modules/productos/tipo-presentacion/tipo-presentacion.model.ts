import { Usuario } from "../../personas/usuarios/usuario.model";

export class TipoPresentacion {
    id:number
    descripcion: String
    unico: Boolean
    creadoEn: Date
    usuario: Usuario
}