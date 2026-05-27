import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Moneda } from '../moneda.model';
import { monedasSearch } from './graphql-query';

export interface Response {
  data: Moneda[];
}


@Injectable({
  providedIn: 'root',
})
export class MonedasSearchGQL extends Query<Response> {
  document = monedasSearch;
}
