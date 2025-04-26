import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VentaCredito } from '../venta-credito.model';
import { findWithFiltersQuery, ventaCreditoPorClienteQuery } from './graphql-query';
import { PageInfo } from '../../../../app.component';

export interface Response {
  ventaCredito: VentaCredito[];
}

@Injectable({
  providedIn: 'root',
})
export class VentaCreditoPorClienteGQL extends Query<PageInfo<VentaCredito>> {
  document = findWithFiltersQuery;
}
