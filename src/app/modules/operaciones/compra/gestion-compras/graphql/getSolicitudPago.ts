import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { solicitudPagoQuery } from './graphql-query';

export interface GetSolicitudPagoVariables {
  id: number;
}

export interface GetSolicitudPagoResponse {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class GetSolicitudPagoGQL extends Query<GetSolicitudPagoResponse, GetSolicitudPagoVariables> {
  document = solicitudPagoQuery;
}