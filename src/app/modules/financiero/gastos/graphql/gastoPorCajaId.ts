import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gasto } from '../gastos.model';
import { gastoQuery, gastosPorCajaIdQuery } from './graphql-query';

export interface Response {
  data: Gasto;
}

@Injectable({
  providedIn: 'root',
})
export class GastoPorCajaIdGQL extends Query<Response> {
  document = gastosPorCajaIdQuery;
}
