import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SolicitudPago, SolicitudPagoInput } from '../solicitud-pago.model';
import { actualizarSolicitudPagoMutation } from './graphql-query';

export interface ActualizarSolicitudPagoVariables {
  entity: SolicitudPagoInput;
}

export interface ActualizarSolicitudPagoResponse {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class ActualizarSolicitudPagoGQL extends Mutation<
  ActualizarSolicitudPagoResponse,
  ActualizarSolicitudPagoVariables
> {
  document = actualizarSolicitudPagoMutation;
}
