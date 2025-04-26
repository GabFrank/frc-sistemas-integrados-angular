import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { solicitudPago } from './graphql-query';

export interface Response {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class SolicitudPagoQuery extends Query<Response> {
  document = solicitudPago;
} 