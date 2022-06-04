import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Zona } from '../zona.model';
import { zonasSearch } from './graphql-query';

export interface Response {
  data: Zona[];
}


@Injectable({
  providedIn: 'root',
})
export class ZonaesSearchGQL extends Query<Response> {
  document = zonasSearch;
}
