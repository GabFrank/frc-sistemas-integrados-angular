import { Sucursal } from "../../empresarial/sucursal/sucursal.model"
import { Moneda } from "../../financiero/moneda/moneda.model"
import { Usuario } from "../../personas/usuarios/usuario.model"
import { Producto } from "../../productos/producto/producto.model"
import { MovimientoStock } from "../movimiento-stock/movimiento-stock.model"

export class CostoPorProducto {
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