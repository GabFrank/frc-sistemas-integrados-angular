import { Usuario } from "../../personas/usuarios/usuario.model"
import { Codigo } from "../codigo/codigo.model"
import { PrecioPorSucursal } from "../precio-por-sucursal/precio-por-sucursal.model"
import { Producto } from "../producto/producto.model"
import { TipoPresentacion } from "../tipo-presentacion/tipo-presentacion.model"

export class Presentacion {
    id:number
    descripcion: String
    activo: Boolean
    principal: Boolean
    producto: Producto
    tipoPresentacion: TipoPresentacion
    cantidad: number
    creadoEn: Date
    imagenPrincipal: String
    usuario: Usuario
    codigos: Codigo[];
    precios: PrecioPorSucursal[];
    codigoPrincipal?: Codigo
    precioPrincipal?: PrecioPorSucursal;
}