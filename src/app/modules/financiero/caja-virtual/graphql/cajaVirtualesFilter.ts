import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cajaVirtualesFilterQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class CajaVirtualesFilterGQL extends Query<Response> {
  document = cajaVirtualesFilterQuery;
}
