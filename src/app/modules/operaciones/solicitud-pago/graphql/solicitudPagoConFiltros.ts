import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { solicitudPagoConFiltros } from './graphql-query';
import { PageInfo } from '../../../../app.component';

export interface Response {
  data: PageInfo<SolicitudPago>;
}

@Injectable({
  providedIn: 'root',
})
export class SolicitudPagoConFiltrosQuery extends Query<Response> {
  document = solicitudPagoConFiltros;
} 