import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countChequeQuery } from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({
  providedIn: 'root',
})
export class GetCountChequeGQL extends Query<Response> {
  document = countChequeQuery;
} 