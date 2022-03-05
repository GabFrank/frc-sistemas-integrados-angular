import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Maletin } from '../maletin.model';
import { searchMaletinQuery } from './graphql-query';

export interface Response {
  data: Maletin;
}

@Injectable({
  providedIn: 'root',
})
export class SearchMaletinGQL extends Query<Response> {
  document = searchMaletinQuery;
}
