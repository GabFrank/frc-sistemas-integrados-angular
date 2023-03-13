import { Usuario } from "../../personas/usuarios/usuario.model";

export class TipoPresentacionInput {
    id:number
    descripcion: String
    unico: Boolean
    usuarioId: number
}