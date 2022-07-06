import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { pingQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class PingGQL extends Query<Response> {
  document = pingQuery;
}
