import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Chequera } from '../chequera.model';
import { chequerasQuery } from './graphql-query';

export interface Response {
  data: Chequera[];
}

@Injectable({
  providedIn: 'root',
})
export class GetChequerasGQL extends Query<Response> {
  document = chequerasQuery;
} 