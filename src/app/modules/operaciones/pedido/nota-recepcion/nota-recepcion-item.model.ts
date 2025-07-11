import { Producto } from "../../../productos/producto/producto.model";
import { PedidoItem } from "../edit-pedido/pedido-item.model";
import { NotaRecepcion } from "./nota-recepcion.model";

export class NotaRecepcionItem {
    id: number;
    notaRecepcion: NotaRecepcion;
    pedidoItem: PedidoItem; // Puede ser nulo si es un item no solicitado
    producto: Producto;
    cantidadEnNota: number;
    precioUnitarioEnNota: number;
    esBonificacion: boolean;
    vencimientoEnNota: Date;
    observacion: string;
} 