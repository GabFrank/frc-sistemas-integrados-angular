import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { VentaCredito } from '../venta-credito.model';
import { cancelarVentaCreditoQuery } from './graphql-query';

export interface Response {
  ventaCredito: VentaCredito;
}

@Injectable({
  providedIn: 'root',
})
export class CancelarVentaCreditoGQL extends Mutation<boolean> {
  document = cancelarVentaCreditoQuery;
}
