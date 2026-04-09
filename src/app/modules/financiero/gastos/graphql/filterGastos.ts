import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gasto } from '../models/gastos.model';
import { filterGastosQuery } from './graphql-query';

export interface Response {
  data: Gasto[];
}

@Injectable({
  providedIn: 'root',
})
export class FilterGastosGQL extends Query<Response> {
  document = filterGastosQuery;
}
