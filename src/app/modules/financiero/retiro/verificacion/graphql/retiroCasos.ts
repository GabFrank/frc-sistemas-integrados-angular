import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { retiroCasosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class RetiroCasosGQL extends Query<Response> {
  document = retiroCasosQuery;
}
