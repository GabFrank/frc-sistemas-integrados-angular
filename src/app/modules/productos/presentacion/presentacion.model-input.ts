import { Usuario } from "../../personas/usuarios/usuario.model"
import { Producto } from "../producto/producto.model"
import { TipoPresentacion } from "../tipo-presentacion/tipo-presentacion.model"

export class PresentacionInput {
    id:number
    descripcion: String
    activo: Boolean
    principal: Boolean
    productoId: number
    tipoPresentacionId: number
    cantidad: number
    usuarioId: number
}