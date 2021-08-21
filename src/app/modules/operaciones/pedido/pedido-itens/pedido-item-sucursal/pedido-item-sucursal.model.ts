import { Sucursal } from "../../../../../modules/empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../../../modules/personas/usuarios/usuario.model";
import { PedidoItem } from "../../edit-pedido/pedido-item.model";

export class PedidoItemSucursal {
    id: number;
    pedidoItem: PedidoItem;
    sucursal: Sucursal;
    sucursalEntrega: Sucursal;
    cantidad: number;
    creadoEn: Date;
    usuario: Usuario;
}

export class PedidoItemSucursalInput {
    id: number;
    pedidoItemId: number;
    sucursalId: number;
    sucursalEntregaId: number;
    cantidad: number;
    usuarioId: number;
    
}