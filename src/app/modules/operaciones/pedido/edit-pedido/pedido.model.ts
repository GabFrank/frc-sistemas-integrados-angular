import { Moneda } from '../../../../modules/financiero/moneda/moneda.model';
import { Proveedor } from '../../../../modules/personas/proveedor/proveedor.model';
import { Usuario } from '../../../../modules/personas/usuarios/usuario.model';
import { PedidoItem, PedidoItemInput } from '../../../../modules/operaciones/pedido/edit-pedido/pedido-item.model';
import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { PedidoEstado } from './pedido-enums';
import { Vendedor } from '../../../personas/vendedor/vendedor.model';
import { NotaRecepcion } from '../nota-recepcion/nota-recepcion.model';
import { Compra } from '../../compra/compra.model';
import { PedidoFechaEntrega } from '../pedido-fecha-entrega/pedido-fecha-entrega.model';
import { PedidoSucursalEntrega } from '../pedido-sucursal-entrega/pedido-sucursal-entrega.model';
import { PedidoSucursalInfluencia } from '../pedido-sucursal-influencia/pedido-sucursal-influencia.model';

export class Pedido {
  id: number;
  compra: Compra;
  proveedor: Proveedor;
  vendedor: Vendedor;
  tipoBoleta: string;
  fechaDeEntrega: Date;
  formaPago: FormaPago;
  estado: PedidoEstado;
  moneda: Moneda;
  plazoCredito: number;
  creadoEn: Date;
  usuario: Usuario;
  descuento: number;
  pedidoItens: PedidoItem[];
  valorTotal: number;
  notaRecepcionList: NotaRecepcion[] = []
  fechaEntregaList: PedidoFechaEntrega[]
  sucursalEntregaList: PedidoSucursalEntrega[]
  sucursalInfluenciaList: PedidoSucursalInfluencia[]
  cantPedidoItem: number;

  toInput(): PedidoInput{
    let input = new PedidoInput();
    input.id = this.id;
    input.proveedorId = this.proveedor?.id
    input.vendedorId = this.vendedor?.id
    input.creadoEn = this.creadoEn;
    input.tipoBoleta = this.tipoBoleta;
    input.estado = this.estado;
    input.fechaDeEntrega = this.fechaDeEntrega;
    input.formaPagoId = this.formaPago?.id
    input.monedaId = this.moneda?.id
    input.plazoCredito = this.plazoCredito;
    input.valorTotal = this.valorTotal;
    input.usuarioId = this.usuario?.id
    input.pedidoItemInputList = []
    this.pedidoItens?.forEach(p => {
      let aux = new PedidoItem;
      Object.assign(aux, p);
      input.pedidoItemInputList.push(aux.toInput())
    })
    return input;
  }
}


export class PedidoInput {
  id: number;
  proveedorId: number;
  vendedorId: number;
  tipoBoleta: string;
  fechaDeEntrega: Date;
  formaPagoId: number;
  estado: PedidoEstado;
  monedaId: number;
  plazoCredito: number;
  creadoEn: Date;
  usuarioId: number;
  valorTotal: number;
  pedidoItemInputList: PedidoItemInput[]
}
