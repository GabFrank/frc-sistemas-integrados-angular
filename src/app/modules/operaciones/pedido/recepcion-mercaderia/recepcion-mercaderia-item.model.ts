import { Producto } from "../../../productos/producto/producto.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { NotaRecepcionItem } from "../nota-recepcion/nota-recepcion-item.model";
import { PedidoItemDistribucion } from "../pedido-item-distribucion/pedido-item-distribucion.model";
import { RecepcionMercaderia } from "./recepcion-mercaderia.model";

export class RecepcionMercaderiaItem {
    id: number;
    recepcionMercaderia: RecepcionMercaderia;
    notaRecepcionItem: NotaRecepcionItem;
    pedidoItemDistribucion: PedidoItemDistribucion; // puede ser nulo
    producto: Producto;
    sucursalEntrega: Sucursal;
    cantidadRecibida: number;
    cantidadRechazada: number;
    esBonificacion: boolean;
    vencimientoRecibido: Date;
    lote: string;
    motivoRechazo: string;
    observacion: string;
} 