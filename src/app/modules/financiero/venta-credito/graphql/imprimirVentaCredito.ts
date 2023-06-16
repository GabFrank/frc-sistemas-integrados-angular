import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VentaCredito } from '../venta-credito.model';
import { imprimirVentaCreditoQuery } from './graphql-query';

export interface Response {
  ventaCredito: VentaCredito[];
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirVentaCreditoGQL extends Query<boolean> {
  document = imprimirVentaCreditoQuery;
}
