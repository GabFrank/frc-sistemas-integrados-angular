import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Vendedor } from '../../../personas/vendedor/vendedor.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { PedidoSucursalEntrega } from './models/pedido-sucursal-entrega.model';
import { PedidoSucursalInfluencia } from './models/pedido-sucursal-influencia.model';
import { ProcesoEtapa } from './proceso-etapa.model';



export class Pedido {
  id: number;
  proveedor: Proveedor;
  vendedor: Vendedor;
  formaPago: FormaPago;
  tipoBoleta: string;
  moneda: Moneda;
  plazoCredito: number;
  observacionFormaPago?: string;

  creadoEn: Date;
  usuario: Usuario;

  // resolvers fields
  sucursalEntregaList: PedidoSucursalEntrega[];
  sucursalInfluenciaList: PedidoSucursalInfluencia[];
  procesoEtapas: ProcesoEtapa[];

  toInput(): PedidoInput {
    let input = new PedidoInput();
    input.id = this?.id;
    input.proveedorId = this?.proveedor?.id;
    input.vendedorId = this?.vendedor?.id;
    input.formaPagoId = this?.formaPago?.id;
    input.tipoBoleta = this?.tipoBoleta;
    input.monedaId = this?.moneda?.id;
    input.plazoCredito = this?.plazoCredito;
    input.observacionFormaPago = this?.observacionFormaPago;

    input.creadoEn = dateToString(this?.creadoEn);
    input.usuarioId = this?.usuario?.id;
    return input;
  }
}

export class PedidoInput {
  id?: number;
  proveedorId?: number;
  vendedorId?: number;
  formaPagoId?: number;
  tipoBoleta?: string;
  monedaId?: number;
  plazoCredito?: number;
  observacionFormaPago?: string;

  creadoEn?: string;
  usuarioId?: number;
} 