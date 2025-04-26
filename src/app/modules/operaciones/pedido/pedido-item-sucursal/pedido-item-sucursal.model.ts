import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { PedidoItem } from '../edit-pedido/pedido-item.model';

export class PedidoItemSucursal {
    id: number;
    pedidoItem: PedidoItem;
    sucursal: Sucursal;
    sucursalEntrega: Sucursal;
    cantidadPorUnidad: number;
    cantidadPorUnidadRecibida: number;
    creadoEn: Date;
    usuario: Usuario;

    toInput(): PedidoItemSucursalInput {
        let input = new PedidoItemSucursalInput();
        input.id = this?.id,
        input.pedidoItemId = this?.pedidoItem?.id;
        input.sucursalId = this?.sucursal?.id;
        input.sucursalEntregaId = this?.sucursalEntrega?.id;
        input.cantidadPorUnidad = this?.cantidadPorUnidad;
        input.cantidadPorUnidadRecibida = this?.cantidadPorUnidadRecibida;
        input.usuarioId = this?.usuario?.id;
        return input;
    }
}

export class PedidoItemSucursalInput {
    id?: number;
    pedidoItemId?: number;
    sucursalId?: number;
    sucursalEntregaId?: number;
    cantidadPorUnidad?: number;
    cantidadPorUnidadRecibida?: number;
    usuarioId?: number;
} 