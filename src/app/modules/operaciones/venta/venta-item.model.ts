import { Usuario } from "../../personas/usuarios/usuario.model";
import { UnidadMedida } from "../../productos/producto/enums/enums";
import { Producto } from "../../productos/producto/producto.model";
import { Venta } from "./venta.model";

export class VentaItem {
    id: number;
    venta: Venta;
    producto: Producto;
    cantidad: number;
    precioCosto: number;
    precioVenta: number;
    unidadMedida: UnidadMedida;
    creadoEn: Date;
    usuario: Usuario;
    valorTotal: number;
}