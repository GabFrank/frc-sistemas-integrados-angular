import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SolicitudPago, SolicitudPagoInput } from '../solicitud-pago.model';
import { saveSolicitudPagoMutation } from './graphql-query';

export interface SaveSolicitudPagoVariables {
  entity: SolicitudPagoInput;
}

export interface SaveSolicitudPagoResponse {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class SaveSolicitudPagoGQL extends Mutation<SaveSolicitudPagoResponse, SaveSolicitudPagoVariables> {
  document = saveSolicitudPagoMutation;
}