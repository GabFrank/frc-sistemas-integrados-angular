import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { gastosPendientesQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class GastosPendientesGQL extends Query<Response> {
  document = gastosPendientesQuery;
}
