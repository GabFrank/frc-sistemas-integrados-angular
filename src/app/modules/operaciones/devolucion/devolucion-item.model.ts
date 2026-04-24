import { Producto } from "../../productos/producto/producto.model";
import { RecepcionMercaderiaItem } from "../pedido/recepcion-mercaderia/recepcion-mercaderia-item.model";
import { Devolucion } from "./devolucion.model";

export class DevolucionItem {
    id: number;
    devolucion: Devolucion;
    recepcionMercaderiaItem: RecepcionMercaderiaItem; // Para trazabilidad
    producto: Producto;
    cantidad: number;
    lote: string;
} 