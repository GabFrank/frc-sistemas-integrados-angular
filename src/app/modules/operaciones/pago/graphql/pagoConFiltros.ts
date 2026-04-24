import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Pago } from '../pago.model';
import { pagoConFiltros } from './graphql-query';
import { PageInfo } from '../../../../app.component';

export interface Response {
  data: PageInfo<Pago>;
}

@Injectable({
  providedIn: 'root',
})
export class PagoConFiltrosQuery extends Query<Response> {
  document = pagoConFiltros;
} 