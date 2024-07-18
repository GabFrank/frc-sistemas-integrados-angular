import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Pedido } from "../edit-pedido/pedido.model";

export class PedidoFechaEntrega {
    id: number;
    pedido: Pedido;
    fechaEntrega: Date;
    creadoEn?: Date;
    usuario?: Usuario;

    constructor(id: number, pedido: Pedido, fechaEntrega: Date, creadoEn: Date, usuario: Usuario) {
        this.id = id;
        this.pedido = pedido;
        this.fechaEntrega = fechaEntrega;
        this.creadoEn = creadoEn;
        this.usuario = usuario;
    }
}


export class PedidoFechaEntregaInput {
    id: number;
    pedidoId: number;
    fechaEntrega: Date;
    creadoEn?: Date;
    usuarioId?: number;

    constructor(id: number, pedidoId: number, fechaEntrega: Date, creadoEn: Date, usuarioId: number) {
        this.id = id;
        this.pedidoId = pedidoId;
        this.fechaEntrega = fechaEntrega;
        this.creadoEn = creadoEn;
        this.usuarioId = usuarioId;
    }
}