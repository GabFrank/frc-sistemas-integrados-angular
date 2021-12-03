import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Maletin } from '../maletin.model';
import { maletinQuery, maletinsQuery } from './graphql-query';

export interface Response {
  data: Maletin[];
}

@Injectable({
  providedIn: 'root',
})
export class AllMaletinsGQL extends Query<Response> {
  document = maletinsQuery;
}
