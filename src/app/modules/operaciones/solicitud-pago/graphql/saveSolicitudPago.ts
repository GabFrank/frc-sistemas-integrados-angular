import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { saveSolicitudPago } from './graphql-query';

export interface Response {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class SaveSolicitudPagoMutation extends Mutation<Response> {
  document = saveSolicitudPago;
} 