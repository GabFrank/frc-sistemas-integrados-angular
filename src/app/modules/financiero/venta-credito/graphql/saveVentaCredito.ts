import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { VentaCredito } from '../venta-credito.model';
import { saveVentaCredito } from './graphql-query';

export interface Response {
  ventaCredito: VentaCredito;
}

@Injectable({
  providedIn: 'root',
})
export class SaveVentaCreditoByIdGQL extends Mutation<Response> {
  document = saveVentaCredito;
}
