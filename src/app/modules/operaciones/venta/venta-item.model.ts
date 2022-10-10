import { Usuario } from "../../personas/usuarios/usuario.model";
import { PrecioPorSucursal } from "../../productos/precio-por-sucursal/precio-por-sucursal.model";
import { Presentacion } from "../../productos/presentacion/presentacion.model";
import { UnidadMedida } from "../../productos/producto/enums/enums";
import { Producto } from "../../productos/producto/producto.model";
import { Venta } from "./venta.model";

export class VentaItem {
    id: number;
    venta: Venta;
    producto: Producto;
    cantidad: number;
    presentacion: Presentacion;
    precioCosto: number;
    precioVenta: PrecioPorSucursal;
    precio: number;
    creadoEn: Date;
    usuario: Usuario;
    valorTotal: number;
    sucursalId: number;

    toInput(): VentaItemInput{
        let input = new VentaItemInput()
        input.id = this.id;
        input.precioCosto = this.precioCosto;
        input.precio = this.precio;
        input.presentacionId = this.presentacion?.id;
        input.presentacionDescripcion = `(${this.presentacion?.cantidad})`;
        input.productoId = this.producto?.id;
        input.productoDescripcion = this.producto?.descripcion;
        input.usuarioId = this.usuario?.id;
        input.valorTotal = this.valorTotal;
        input.ventaId = this.venta?.id;
        input.cantidad = this.cantidad;
        input.precioVentaId = this.precioVenta?.id;
        input.sucursalId = this.sucursalId
        return input;
    }
}

export class VentaItemInput {
    id: number;
    ventaId: number;
    productoId: number;
    productoDescripcion: string;
    cantidad: number;
    presentacionId: number;
    presentacionDescripcion: string;
    precioCosto: number;
    precioVentaId: number;
    precio: number;
    creadoEn: Date;
    usuarioId: number;
    valorTotal: number;
    sucursalId: number;
}