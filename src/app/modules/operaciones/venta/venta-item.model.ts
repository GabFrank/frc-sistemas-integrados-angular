import { Usuario } from "../../personas/usuarios/usuario.model";
import { PrecioPorSucursal } from "../../productos/precio-por-sucursal/precio-por-sucursal.model";
import { Presentacion } from "../../productos/presentacion/presentacion.model";
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
    valorDescuento: number = 0;
    activo: boolean
    /**
     * Lotes elegidos a mano por el cajero, en presentaciones. Vacío o sin definir significa FEFO
     * automático, que es el camino de casi todas las ventas. Solo se completa para productos con
     * control de lote y solo si el cajero abre el selector.
     */
    lotes: VentaItemLoteInput[];

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
        input.ventaId = this.venta?.id;
        input.cantidad = this.cantidad;
        input.precioVentaId = this.precioVenta?.id;
        input.sucursalId = this.sucursalId
        input.valorDescuento = this.valorDescuento;
        input.activo = this.activo;
        // Se omite cuando está vacío para que el backend lo lea como FEFO puro.
        input.lotes = this.lotes?.length ? this.lotes : null;
        return input;
    }
}

/** Lote elegido a mano para un ítem. La cantidad va en presentaciones; el backend convierte. */
export class VentaItemLoteInput {
    loteId: number;
    cantidad: number;
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
    usuarioId: number = null;
    sucursalId: number;
    valorDescuento: number;
    activo: boolean
    /** Null = FEFO puro. Ver VentaLoteService en el filial. */
    lotes: VentaItemLoteInput[];
}
