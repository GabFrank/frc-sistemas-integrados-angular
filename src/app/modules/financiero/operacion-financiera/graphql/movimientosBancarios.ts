import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { movimientosBancariosQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class MovimientosBancariosGQL extends Query<Response> {
  document = movimientosBancariosQuery;
}
