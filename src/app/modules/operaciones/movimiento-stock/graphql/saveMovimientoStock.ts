import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { MovimientoStock } from '../movimiento-stock.model';
import { saveMovimientoStockMutationQuery } from './graphql-query';

export interface Response {
  data: MovimientoStock;
}

@Injectable({
  providedIn: 'root',
})
export class SaveMovimientoStockGQL extends Mutation<Response> {
  document = saveMovimientoStockMutationQuery;
} 