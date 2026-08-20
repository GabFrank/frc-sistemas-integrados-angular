import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { valesPendientesQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ValesPendientesGQL extends Query<Response> {
  document = valesPendientesQuery;
}
