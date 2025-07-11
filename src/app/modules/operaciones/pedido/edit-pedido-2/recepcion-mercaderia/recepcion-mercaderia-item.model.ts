import { Presentacion } from "../../../stock/presentacion/presentacion.model";
import { Producto } from "../../../stock/producto/producto.model";
import { PedidoItem } from "../edit-pedido/pedido-item.model";

export class RecepcionMercaderiaItem {
    id: number;
    producto: Producto;
    presentacion: Presentacion;
    pedidoItem: PedidoItem;
    cantidad: number;
    lote: string;
    vencimiento: Date;
}

export class RecepcionMercaderiaItemInput {
    id?: number;
    productoId: number;
    presentacionId: number;
    pedidoItemId: number;
    cantidad: number;
    lote: string;
    vencimiento: string; // En formato 'dd/MM/yyyy'
} 