import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { chequesSearchQuery } from './graphql-query';

export interface Response {
  data: Cheque[];
}

@Injectable({
  providedIn: 'root',
})
export class GetChequesSearchGQL extends Query<Response> {
  document = chequesSearchQuery;
} 