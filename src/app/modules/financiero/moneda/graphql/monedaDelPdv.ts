import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Moneda } from '../moneda.model';
import { monedaDelPdvQuery } from './graphql-query';

export interface Response {
  data: Moneda;
}

@Injectable({
  providedIn: 'root',
})
export class MonedaDelPdvGQL extends Query<Response> {
  document = monedaDelPdvQuery;
}
