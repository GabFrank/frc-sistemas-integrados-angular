import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Zona } from '../zona.model';
import { zonasQuery } from './graphql-query';

export interface Response {
  data: Zona[];
}

@Injectable({
  providedIn: 'root',
})
export class ZonasGQL extends Query<Zona[]> {
  document = zonasQuery;
}
