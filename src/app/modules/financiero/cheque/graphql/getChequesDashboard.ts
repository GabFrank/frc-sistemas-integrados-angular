import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { chequesDashboardQuery } from './graphql-query';

export interface Response {
  data: Cheque[];
}

@Injectable({
  providedIn: 'root',
})
export class GetChequesDashboardGQL extends Query<Response> {
  document = chequesDashboardQuery;
}
