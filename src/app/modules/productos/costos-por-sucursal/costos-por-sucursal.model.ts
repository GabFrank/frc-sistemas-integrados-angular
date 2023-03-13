import { Sucursal } from "../../empresarial/sucursal/sucursal.model"
import { Moneda } from "../../financiero/moneda/moneda.model"
import { MovimientoStock } from "../../operaciones/movimiento-stock/movimiento-stock.model"
import { Usuario } from "../../personas/usuarios/usuario.model"
import { Producto } from "../producto/producto.model"

export class CostosPorSucursal {
    id:number
    sucursal: Sucursal
    producto: Producto
    movimientoStock: MovimientoStock
    ultimoPrecioCompra: number
    ultimoPrecioVenta: number
    costoMedio: number
    moneda: Moneda
    cotizacion: number
    existencia: number
    creadoEn: Date
    usuario: Usuario
}