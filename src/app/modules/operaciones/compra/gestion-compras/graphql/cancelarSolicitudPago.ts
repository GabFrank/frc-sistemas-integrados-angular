import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { cancelarSolicitudPagoMutation } from './graphql-query';

export interface CancelarSolicitudPagoVariables {
  id: number;
  motivo: string;
}

export interface CancelarSolicitudPagoResponse {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class CancelarSolicitudPagoGQL extends Mutation<CancelarSolicitudPagoResponse, CancelarSolicitudPagoVariables> {
  document = cancelarSolicitudPagoMutation;
}
