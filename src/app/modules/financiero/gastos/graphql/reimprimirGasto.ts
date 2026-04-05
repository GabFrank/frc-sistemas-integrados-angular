import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gasto } from '../models/gastos.model';
import { gastoQuery, reimprimirQuery } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReimprimirGastoGQL extends Query<Response> {
  document = reimprimirQuery;
}
