import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VentaCredito } from '../venta-credito.model';
import { ventaCreditoPorClienteQuery } from './graphql-query';

export interface Response {
  ventaCredito: VentaCredito[];
}

@Injectable({
  providedIn: 'root',
})
export class VentaCreditoPorClienteGQL extends Query<Response> {
  document = ventaCreditoPorClienteQuery;
}
