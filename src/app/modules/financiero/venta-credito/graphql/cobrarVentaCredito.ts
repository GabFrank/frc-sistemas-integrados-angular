import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { VentaCredito } from '../venta-credito.model';
import { cobrarVentaCreditoQuery } from './graphql-query';

export interface Response {
  ventaCredito: VentaCredito;
}

@Injectable({
  providedIn: 'root',
})
export class CobrarVentaCreditoGQL extends Mutation<boolean> {
  document = cobrarVentaCreditoQuery;
}
