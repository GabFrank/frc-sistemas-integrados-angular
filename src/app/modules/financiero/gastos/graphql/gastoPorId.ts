import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gasto } from '../gastos.model';
import { gastoQuery } from './graphql-query';

export interface Response {
  gasto: Gasto;
}

@Injectable({
  providedIn: 'root',
})
export class GastoPorIdGQL extends Query<Response> {
  document = gastoQuery;
}
