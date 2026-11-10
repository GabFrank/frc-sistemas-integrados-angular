import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Moneda } from '../moneda.model';
import { monedasAbmQuery } from './graphql-query';

export interface Response {
  data: Moneda[];
}

@Injectable({
  providedIn: 'root',
})
export class MonedasAbmGQL extends Query<Response> {
  document = monedasAbmQuery;
}
