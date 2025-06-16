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
import { dateToString } from '../../../../commons/core/utils/dateUtils';

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
  cantPedidoItemSinNota: number;
  cantPedidoItemCancelados: number = 0;
  cantNotas: number;
  cantNotasPagadas: number;
  cantNotasCanceladas: number;
  pagado: boolean;

  // Step tracking fields following the same pattern as PedidoItem
  
  // Step: Creacion (Datos del pedido)
  usuarioCreacion: Usuario;
  fechaInicioCreacion: Date;
  fechaFinCreacion: Date;
  progresoCreacion: number;
  
  // Step: Recepcion Nota
  usuarioRecepcionNota: Usuario;
  fechaInicioRecepcionNota: Date;
  fechaFinRecepcionNota: Date;
  progresoRecepcionNota: number;
  
  // Step: Recepcion Mercaderia
  usuarioRecepcionMercaderia: Usuario;
  fechaInicioRecepcionMercaderia: Date;
  fechaFinRecepcionMercaderia: Date;
  progresoRecepcionMercaderia: number;
  
  // Step: Solicitud Pago
  usuarioSolicitudPago: Usuario;
  fechaInicioSolicitudPago: Date;
  fechaFinSolicitudPago: Date;
  progresoSolicitudPago: number;

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
    
    // Step tracking fields
    input.usuarioCreacionId = this.usuarioCreacion?.id;
    input.fechaInicioCreacion = dateToString(this.fechaInicioCreacion);
    input.fechaFinCreacion = dateToString(this.fechaFinCreacion);
    input.progresoCreacion = this.progresoCreacion;
    
    input.usuarioRecepcionNotaId = this.usuarioRecepcionNota?.id;
    input.fechaInicioRecepcionNota = dateToString(this.fechaInicioRecepcionNota);
    input.fechaFinRecepcionNota = dateToString(this.fechaFinRecepcionNota);
    input.progresoRecepcionNota = this.progresoRecepcionNota;
    
    input.usuarioRecepcionMercaderiaId = this.usuarioRecepcionMercaderia?.id;
    input.fechaInicioRecepcionMercaderia = dateToString(this.fechaInicioRecepcionMercaderia);
    input.fechaFinRecepcionMercaderia = dateToString(this.fechaFinRecepcionMercaderia);
    input.progresoRecepcionMercaderia = this.progresoRecepcionMercaderia;
    
    input.usuarioSolicitudPagoId = this.usuarioSolicitudPago?.id;
    input.fechaInicioSolicitudPago = dateToString(this.fechaInicioSolicitudPago);
    input.fechaFinSolicitudPago = dateToString(this.fechaFinSolicitudPago);
    input.progresoSolicitudPago = this.progresoSolicitudPago;
    
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
  usuarioId: number = null;
  valorTotal: number;
  pedidoItemInputList: PedidoItemInput[]
  
  // Step tracking fields
  usuarioCreacionId: number;
  fechaInicioCreacion: string;
  fechaFinCreacion: string;
  progresoCreacion: number;
  
  usuarioRecepcionNotaId: number;
  fechaInicioRecepcionNota: string;
  fechaFinRecepcionNota: string;
  progresoRecepcionNota: number;
  
  usuarioRecepcionMercaderiaId: number;
  fechaInicioRecepcionMercaderia: string;
  fechaFinRecepcionMercaderia: string;
  progresoRecepcionMercaderia: number;
  
  usuarioSolicitudPagoId: number;
  fechaInicioSolicitudPago: string;
  fechaFinSolicitudPago: string;
  progresoSolicitudPago: number;
}

export interface PedidoRecepcionNotaSummary {
  totalItems: number;
  assignedItems: number;
  pendingItems: number;
  cancelledItems: number;
  totalNotas: number;
  itemsNeedingDistribution: number;
}

export interface PedidoSummary {
  totalItems: number;
  cancelledItems: number;
  activeItems: number;
  totalSinDescuento: number;
  totalDescuento: number;
  totalConDescuento: number;
  estado: PedidoEstado;
}
