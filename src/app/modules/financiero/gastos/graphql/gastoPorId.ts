import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gasto } from '../models/gastos.model';
import { gastoQuery } from './graphql-query';

export interface Response {
  data: Gasto;
}

@Injectable({
  providedIn: 'root',
})
export class GastoPorIdGQL extends Query<Response> {
  document = gastoQuery;
}
