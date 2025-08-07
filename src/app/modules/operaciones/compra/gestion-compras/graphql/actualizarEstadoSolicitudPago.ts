import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SolicitudPago, SolicitudPagoEstado } from '../solicitud-pago.model';
import { actualizarEstadoSolicitudPagoMutation } from './graphql-query';

export interface ActualizarEstadoSolicitudPagoVariables {
  id: number;
  estado: SolicitudPagoEstado;
}

export interface ActualizarEstadoSolicitudPagoResponse {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class ActualizarEstadoSolicitudPagoGQL extends Mutation<ActualizarEstadoSolicitudPagoResponse, ActualizarEstadoSolicitudPagoVariables> {
  document = actualizarEstadoSolicitudPagoMutation;
}