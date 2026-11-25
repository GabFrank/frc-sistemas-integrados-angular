import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { chequesAAnularQuery } from './graphql-query';

export interface Response {
  data: Cheque[];
}

@Injectable({
  providedIn: 'root',
})
export class GetChequesAAnularGQL extends Query<Response> {
  document = chequesAAnularQuery;
}
