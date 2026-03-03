import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { solicitudesPagoPorPedidoQuery } from './graphql-query';

export interface GetSolicitudesPorPedidoVariables {
  pedidoId: number;
}

export interface GetSolicitudesPorPedidoResponse {
  data: SolicitudPago[];
}

@Injectable({
  providedIn: 'root',
})
export class GetSolicitudesPorPedidoGQL extends Query<GetSolicitudesPorPedidoResponse, GetSolicitudesPorPedidoVariables> {
  document = solicitudesPagoPorPedidoQuery;
}