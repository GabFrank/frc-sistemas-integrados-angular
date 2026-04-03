import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cargo } from '../cargo.model';
import { cargosSearch } from './graphql-query';

export interface Response {
  cargosSearch: Cargo[];
}

@Injectable({
  providedIn: 'root',
})
export class CargosSearchGQL extends Query<Response> {
  document = cargosSearch;
}
