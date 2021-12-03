import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gasto } from '../gastos.model';
import { gastoQuery, gastosPorFecha, gastosQuery } from './graphql-query';

export interface Response {
  data: Gasto[];
}

@Injectable({
  providedIn: 'root',
})
export class GastosPorFechaGQL extends Query<Response> {
  document = gastosPorFecha;
}
