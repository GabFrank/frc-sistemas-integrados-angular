import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { VentaCredito } from '../venta-credito.model';
import { finalizarVentaCreditoQuery } from './graphql-query';

export interface Response {
  ventaCredito: VentaCredito;
}

@Injectable({
  providedIn: 'root',
})
export class FinalizarVentaCreditoGQL extends Mutation<boolean> {
  document = finalizarVentaCreditoQuery;
}
