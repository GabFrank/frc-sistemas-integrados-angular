import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Maletin } from '../maletin.model';
import { maletinPorDescripcionQuery, maletinQuery } from './graphql-query';

export interface Response {
  data: Maletin;
}

@Injectable({
  providedIn: 'root',
})
export class MaletinPorDescripcionGQL extends Query<Response> {
  document = maletinPorDescripcionQuery;
}
