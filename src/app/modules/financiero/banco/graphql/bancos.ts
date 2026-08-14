import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { bancosQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class BancosGQL extends Query<Response> {
  document = bancosQuery;
}
