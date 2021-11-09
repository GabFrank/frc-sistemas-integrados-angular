import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { MovimientoStock } from '../movimiento-stock.model';
import { movimientoPorFechaQuery, stockPorProductoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetStockPorProductoGQL extends Query<number> {
  document = stockPorProductoQuery;
}
