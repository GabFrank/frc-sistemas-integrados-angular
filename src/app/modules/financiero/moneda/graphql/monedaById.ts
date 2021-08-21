import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Moneda } from '../moneda.model';
import { monedaQuery } from './graphql-query';

export interface Response {
  moneda: Moneda;
}

@Injectable({
  providedIn: 'root',
})
export class MonedaByIdGQL extends Query<Response> {
  document = monedaQuery;
}
