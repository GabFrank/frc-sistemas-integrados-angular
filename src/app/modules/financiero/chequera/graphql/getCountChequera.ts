import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countChequeraQuery } from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({
  providedIn: 'root',
})
export class GetCountChequeraGQL extends Query<Response> {
  document = countChequeraQuery;
} 