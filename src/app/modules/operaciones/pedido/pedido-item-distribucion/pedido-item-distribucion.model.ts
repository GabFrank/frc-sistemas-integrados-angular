import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { PedidoItem } from "../edit-pedido/pedido-item.model";

export class PedidoItemDistribucion {
    id: number;
    pedidoItem: PedidoItem;
    sucursalEntrega: Sucursal;
    cantidadAsignada: number;
} 