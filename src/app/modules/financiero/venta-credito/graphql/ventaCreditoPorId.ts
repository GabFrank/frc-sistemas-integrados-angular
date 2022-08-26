import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VentaCredito } from '../venta-credito.model';
import { ventaCreditoQuery } from './graphql-query';

export interface Response {
  ventaCredito: VentaCredito;
}

@Injectable({
  providedIn: 'root',
})
export class VentaCreditoByIdGQL extends Query<Response> {
  document = ventaCreditoQuery;
}
