import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Moneda } from '../moneda.model';
import { monedaQuery, monedasQuery } from './graphql-query';

export interface Response {
  data: Moneda[];
}

@Injectable({
  providedIn: 'root',
})
export class MonedasGetAllGQL extends Query<Response> {
  document = monedasQuery;
}
