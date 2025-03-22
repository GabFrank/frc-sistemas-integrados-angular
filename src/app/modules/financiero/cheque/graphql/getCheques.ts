import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { chequesQuery } from './graphql-query';

export interface Response {
  data: Cheque[];
}

@Injectable({
  providedIn: 'root',
})
export class GetChequesGQL extends Query<Response> {
  document = chequesQuery;
} 