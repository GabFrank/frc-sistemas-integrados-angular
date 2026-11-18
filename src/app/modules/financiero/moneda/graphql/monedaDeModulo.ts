import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Moneda } from '../moneda.model';
import { monedaDeModuloQuery } from './graphql-query';

export interface Response {
  data: Moneda;
}

@Injectable({
  providedIn: 'root',
})
export class MonedaDeModuloGQL extends Query<Response> {
  document = monedaDeModuloQuery;
}
