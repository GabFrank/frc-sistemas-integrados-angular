import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Chequera } from '../chequera.model';
import { chequerasSearchQuery } from './graphql-query';

export interface Response {
  data: Chequera[];
}

@Injectable({
  providedIn: 'root',
})
export class GetChequerasSearchGQL extends Query<Response> {
  document = chequerasSearchQuery;
} 