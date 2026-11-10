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
     * Lotes elegidos a mano por el cajero, en unidades. Vacío o sin definir significa FEFO
     * automático, que es el camino de casi todas las ventas. Solo se completa para productos con
     * control de lote y solo si el cajero abre el selector.
     */
    lotes: VentaItemLoteInput[];
    /**
     * Rastro de un precio en otra moneda (Fase 3): solo si el ítem se convirtió al agregarlo. `precio` queda en
     * la moneda de cobro y estos tres dicen de dónde salió: id de la moneda del precio, precio de lista en esa
     * moneda y cotización usada (unidades de la moneda de cobro por unidad de la del precio). Ausentes en un
     * ítem en la moneda de la empresa.
     */
    precioMonedaId?: number;
    precioLista?: number;
    precioCotizacion?: number;
    /**
     * Precio unitario (bruto, como `precio`) en la moneda del PDV (Fase 4). Solo lo completa el PDV al guardar
     * cuando la moneda del PDV no es la de la empresa: entonces `precio` y `valorDescuento` ya van en la moneda
     * de la empresa (el equivalente). Sin definir = la clave no viaja.
     */
    precioEnMoneda?: number;
    /** Solo pantalla (no viaja): el precio de lista con su símbolo, p. ej. "US$ 4,39". */
    precioListaTexto?: string;
    /** Solo pantalla (no viaja al servidor): "Lote X · Vto dd/mm/aa" bajo el ítem antes de cobrar (#429). */
    lotesEtiqueta?: string;

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
        // El rastro viaja SOLO si el ítem se convirtió: las claves se omiten (no se mandan en null), porque una
        // filial anterior rechaza el input entero si llega una clave que no conoce.
        if (this.precioMonedaId != null && this.precioLista != null && this.precioCotizacion != null) {
            input.precioMonedaId = this.precioMonedaId;
            input.precioLista = this.precioLista;
            input.precioCotizacion = this.precioCotizacion;
        }
        if (this.precioEnMoneda != null) {
            input.precioEnMoneda = this.precioEnMoneda;
        }
        return input;
    }
}

/**
 * Lote elegido a mano para un ítem. La cantidad va EN UNIDADES, la misma unidad que muestra el
 * selector del POS y en la que el backend lleva el ledger de lotes: no hay conversión en el medio.
 */
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
    /** Rastro del precio convertido (ver VentaItem). Las tres claves existen solo si el ítem se convirtió. */
    precioMonedaId?: number;
    precioLista?: number;
    precioCotizacion?: number;
    /** Precio en la moneda del PDV (ver VentaItem). Existe solo si la moneda del PDV no es la de la empresa. */
    precioEnMoneda?: number;
}
