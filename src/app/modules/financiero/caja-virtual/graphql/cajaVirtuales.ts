import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { CajaVirtual } from '../caja-virtual.model';
import { cajaVirtualesQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class CajaVirtualesGQL extends Query<Response> {
  document = cajaVirtualesQuery;
}
