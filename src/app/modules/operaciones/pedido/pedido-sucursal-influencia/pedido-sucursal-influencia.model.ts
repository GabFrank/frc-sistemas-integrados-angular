import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Pedido } from "../edit-pedido/pedido.model";

export class PedidoSucursalInfluencia {
    id: number;
    pedido: Pedido;
    sucursal: Sucursal;
    creadoEn?: Date;
    usuario?: Usuario;

    constructor(id: number, pedido: Pedido, sucursal: Sucursal, creadoEn: Date, usuario: Usuario) {
        this.id = id;
        this.pedido = pedido;
        this.sucursal = sucursal;
        this.creadoEn = creadoEn;
        this.usuario = usuario;
    }
}

export class PedidoSucursalInfluenciaInput {
    id: number;
    pedidoId: number;
    sucursalId: number;
    creadoEn?: Date;
    usuarioId?: number;

    constructor(id: number, pedidoId: number, sucursalId: number, creadoEn: Date, usuarioId: number) {
        this.id = id;
        this.pedidoId = pedidoId;
        this.sucursalId = sucursalId;
        this.creadoEn = creadoEn;
        this.usuarioId = usuarioId;
    }
}