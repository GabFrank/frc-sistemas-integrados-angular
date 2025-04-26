import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { solicitudPagoPorUsuarioId } from './graphql-query';

export interface Response {
  data: SolicitudPago[];
}

@Injectable({
  providedIn: 'root',
})
export class SolicitudPagoPorUsuarioIdQuery extends Query<Response> {
  document = solicitudPagoPorUsuarioId;
} 