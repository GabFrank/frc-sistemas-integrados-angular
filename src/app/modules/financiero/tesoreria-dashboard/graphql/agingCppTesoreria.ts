import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { agingCppTesoreriaQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class AgingCppTesoreriaGQL extends Query<Response> {
  document = agingCppTesoreriaQuery;
}
