import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cargo } from '../cargo.model';
import { cargosQuery } from './graphql-query';

export interface Response {
  cargos: Cargo[];
}

@Injectable({
  providedIn: 'root',
})
export class CargosGQL extends Query<Response> {
  document = cargosQuery;
}
