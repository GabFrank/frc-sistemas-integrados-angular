import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Presentacion } from "../../productos/presentacion/presentacion.model";
import { dateToString } from '../../../commons/core/utils/dateUtils';

export enum TransferenciaEstado {
  ABIERTA = 'ABIERTA', //la transferencia esta siendo creada
  EN_ORIGEN = 'EN_ORIGEN', //la transferencia ha sido creada pero aun esta en el deposito de origen
  EN_TRANSITO = 'EN_TRANSITO', //la transferencia esta en camino
  EN_DESTINO = 'EN_DESTINO', //la transferencia ha llegado al destino y esta en verificacion
  FALTA_REVISION_EN_ORIGEN = 'FALTA_REVISION_EN_ORIGEN', //la transferencia ha sido creada y esta en el deposito de origen pero exige una revision
  FALTA_REVISION_EN_DESTINO = 'FALTA_REVISION_EN_DESTINO', //la transferencia ha sido creada y esta en el deposito de destino pero exige una revision
  CONLCUIDA = 'CONLCUIDA',
  CANCELADA = 'CANCELADA'
}

export enum TipoTransferencia {
  MANUAL = 'MANUAL', //hecho por un usuario
  AUTOMATICA = 'AUTOMATICA', //hecha por el sistema
  MIXTA = 'MIXTA' //hecha por el sistema pero modificada por un usuario
}

export enum TransferenciaItemMotivoRechazo {
  FALTA_PRODUCTO = 'FALTA_PRODUCTO',
  PRODUCTO_AVERIADO = 'PRODUCTO_AVERIADO',
  PRODUCTO_VENCIDO = 'PRODUCTO_VENCIDO',
  PRODUCTO_EQUIVOCADO = 'PRODUCTO_EQUIVOCADO'
}

export enum TransferenciaItemMotivoModificacion {
  CANTIDAD_INCORRECTA = 'CANTIDAD_INCORRECTA',
  VENCIMIENTO_INCORRECTO = 'VENCIMIENTO_INCORRECTO',
  PRESENTACION_INCORRECTA = 'PRESENTACION_INCORRECTA'
}

export enum EtapaTransferencia {
  PRE_TRANSFERENCIA = 'PRE_TRANSFERENCIA',
  PREPARACION_MERCADERIA = 'PREPARACION_MERCADERIA',
  TRANSPORTE = 'TRANSPORTE',
  RECEPCION = 'RECEPCION'
}

export class Transferencia {
  id: number;
  sucursalOrigen: Sucursal;
  sucursalDestino: Sucursal;
  estado: TransferenciaEstado;
  tipo: TipoTransferencia
  observacion: string;
  usuario: Usuario;
  isOrigen: boolean;
  isDestino: boolean;
  creadoEn: Date;
  transferenciaItemList: TransferenciaItem[]

  toInput(): TransferenciaInput {
    let input = new TransferenciaInput;
    input.id = this.id;
    input.creadoEn = this.creadoEn;
    input.estado = this.estado;
    input.tipo = this.tipo;
    input.observacion = this.observacion;
    input.sucursalDestinoId = this.sucursalDestino?.id;
    input.sucursalOrigenId = this.sucursalOrigen?.id;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

export class TransferenciaInput {
  id: number;
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  estado: TransferenciaEstado;
  tipo: TipoTransferencia
  observacion: string;
  usuarioId: number;
  creadoEn: Date;
}

export class TransferenciaItem {
  id: number;
  transferencia: Transferencia
  presentacionPreTransferencia: Presentacion
  presentacionPreparacion: Presentacion
  presentacionTransporte: Presentacion
  presentacionRecepcion: Presentacion
  cantidadPreTransferencia: number
  cantidadPreparacion: number
  cantidadTransporte: number
  cantidadRecepcion: number
  observacionPreTransferencia: string
  observacionPreparacion: string
  observacionTransporte: string
  observacionRecepcion: string
  vencimientoPreTransferencia: Date
  vencimientoPreparacion: Date
  vencimientoTransporte: Date
  vencimientoRecepcion: Date
  motivoModificacionPreTransferencia: TransferenciaItemMotivoModificacion
  motivoModificacionPreparacion: TransferenciaItemMotivoModificacion
  motivoModificacionTransporte: TransferenciaItemMotivoModificacion
  motivoModificacionRecepcion: TransferenciaItemMotivoModificacion
  motivoRechazoPreTransferencia: TransferenciaItemMotivoRechazo
  motivoRechazoPreparacion: TransferenciaItemMotivoRechazo
  motivoRechazoTransporte: TransferenciaItemMotivoRechazo
  motivoRechazoRecepcion: TransferenciaItemMotivoRechazo
  etapa: EtapaTransferencia
  activo: boolean
  poseeVencimiento: boolean
  usuario: Usuario;
  creadoEn: Date;

  toInput(): TransferenciaItemInput {
    let input = new TransferenciaItemInput;
    input.id = this.id;
    input.transferenciaId = this.transferencia?.id;
    input.presentacionPreTransferenciaId = this.presentacionPreTransferencia?.id;
    input.presentacionPreparacionId = this.presentacionPreparacion?.id;
    input.presentacionTransporteId = this.presentacionTransporte?.id
    input.presentacionRecepcionId = this.presentacionRecepcion?.id;
    input.cantidadPreTransferencia = this.cantidadPreTransferencia;
    input.cantidadPreparacion = this.cantidadPreparacion;
    input.cantidadTransporte = this.cantidadTransporte;
    input.cantidadRecepcion = this.cantidadRecepcion;
    input.observacionPreTransferencia = this.observacionPreTransferencia;
    input.observacionPreparacion = this.observacionPreparacion;
    input.observacionTransporte = this.observacionTransporte;
    input.observacionRecepcion = this.observacionRecepcion;
    input.vencimientoPreTransferencia = dateToString(this.vencimientoPreTransferencia)
    input.vencimientoPreparacion = dateToString(this.vencimientoPreparacion);
    input.vencimientoTransporte = dateToString(this.vencimientoTransporte);
    input.vencimientoRecepcion = dateToString(this.vencimientoRecepcion);
    input.motivoModificacionPreTransferencia = this.motivoModificacionPreTransferencia;
    input.motivoModificacionPreparacion = this.motivoModificacionPreTransferencia;
    input.motivoModificacionTransporte = this.motivoModificacionTransporte;
    input.motivoModificacionRecepcion = this.motivoModificacionRecepcion;
    input.motivoRechazoPreTransferencia = this.motivoRechazoPreTransferencia;
    input.motivoRechazoPreparacion = this.motivoRechazoPreparacion;
    input.motivoRechazoTransporte = this.motivoRechazoTransporte;
    input.motivoRechazoRecepcion = this.motivoRechazoRecepcion;
    input.etapa = this.etapa;
    input.activo = this.activo;
    input.poseeVencimiento  = this.poseeVencimiento;     
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

export class TransferenciaItemInput {
  id: number;
  transferenciaId: number
  presentacionPreTransferenciaId: number
  presentacionPreparacionId: number
  presentacionTransporteId: number
  presentacionRecepcionId: number
  cantidadPreTransferencia: number
  cantidadPreparacion: number
  cantidadTransporte: number
  cantidadRecepcion: number
  observacionPreTransferencia: string
  observacionPreparacion: string
  observacionTransporte: string
  observacionRecepcion: string
  vencimientoPreTransferencia: string
  vencimientoPreparacion: string
  vencimientoTransporte: string
  vencimientoRecepcion: string
  motivoModificacionPreTransferencia: TransferenciaItemMotivoModificacion
  motivoModificacionPreparacion: TransferenciaItemMotivoModificacion
  motivoModificacionTransporte: TransferenciaItemMotivoModificacion
  motivoModificacionRecepcion: TransferenciaItemMotivoModificacion
  motivoRechazoPreTransferencia: TransferenciaItemMotivoRechazo
  motivoRechazoPreparacion: TransferenciaItemMotivoRechazo
  motivoRechazoTransporte: TransferenciaItemMotivoRechazo
  motivoRechazoRecepcion: TransferenciaItemMotivoRechazo
  etapa: EtapaTransferencia
  activo: boolean
  poseeVencimiento: boolean
  usuarioId: number;
  creadoEn: Date;
} 