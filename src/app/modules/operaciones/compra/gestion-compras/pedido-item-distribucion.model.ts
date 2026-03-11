import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { PedidoItem } from './pedido-item.model';

export class PedidoItemDistribucion {
  id?: number;
  pedidoItem: PedidoItem;
  sucursalInfluencia: Sucursal;
  sucursalEntrega: Sucursal;
  cantidadAsignada: number;

  toInput(): PedidoItemDistribucionInput {
    let input = new PedidoItemDistribucionInput();
    input.id = this?.id;
    input.pedidoItemId = this?.pedidoItem?.id;
    input.sucursalInfluenciaId = this?.sucursalInfluencia?.id;
    input.sucursalEntregaId = this?.sucursalEntrega?.id;
    input.cantidadAsignada = this?.cantidadAsignada;
    return input;
  }
}

export class PedidoItemDistribucionInput {
  id?: number;
  pedidoItemId?: number;
  sucursalInfluenciaId?: number;
  sucursalEntregaId?: number;
  cantidadAsignada?: number;
}