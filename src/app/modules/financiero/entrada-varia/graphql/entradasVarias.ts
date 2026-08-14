import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { entradasVariasQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class EntradasVariasGQL extends Query<Response> {
  document = entradasVariasQuery;
}
