import { Usuario } from '../../../personas/usuarios/usuario.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { Pedido } from './pedido.model';

export enum ProcesoEtapaTipo {
  CREACION = 'CREACION',
  RECEPCION_NOTA = 'RECEPCION_NOTA',
  RECEPCION_MERCADERIA = 'RECEPCION_MERCADERIA',
  SOLICITUD_PAGO = 'SOLICITUD_PAGO'
}

export enum ProcesoEtapaEstado {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
  OMITIDA = 'OMITIDA'
}

export class ProcesoEtapa {
  id?: number;
  pedido: Pedido;
  tipoEtapa: ProcesoEtapaTipo;
  estadoEtapa: ProcesoEtapaEstado;
  fechaInicio: Date;
  fechaFin: Date;
  usuarioInicio: Usuario;
  creadoEn: Date;

  toInput(): ProcesoEtapaInput {
    let input = new ProcesoEtapaInput();
    input.id = this?.id;
    input.pedidoId = this?.pedido?.id;
    input.tipoEtapa = this?.tipoEtapa;
    input.estadoEtapa = this?.estadoEtapa;
    input.fechaInicio = dateToString(this?.fechaInicio);
    input.fechaFin = dateToString(this?.fechaFin);
    input.usuarioInicioId = this?.usuarioInicio?.id;
    input.creadoEn = dateToString(this?.creadoEn);
    return input;
  }
}

export class ProcesoEtapaInput {
  id?: number;
  pedidoId?: number;
  tipoEtapa?: ProcesoEtapaTipo;
  estadoEtapa?: ProcesoEtapaEstado;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioInicioId?: number;
  creadoEn?: string;
} 