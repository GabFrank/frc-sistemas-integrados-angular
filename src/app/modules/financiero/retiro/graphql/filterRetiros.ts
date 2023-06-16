import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Retiro } from '../retiro.model';
import { filterRetirosQuery, retiroListPorCajaSalidaIdQuery } from './graphql-query';

export interface Response {
  data: Retiro[];
}

@Injectable({
  providedIn: 'root',
})
export class FilterRetirosGQL extends Query<Response> {
  document = filterRetirosQuery;
}
