import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { MovimientoStock } from '../movimiento-stock.model';
import { movimientoPorFechaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetMovimientosPorFechaGQL extends Query<MovimientoStock[]> {
  document = movimientoPorFechaQuery;
}
