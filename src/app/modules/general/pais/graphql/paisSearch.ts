import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Pais } from '../pais.model';
import { paisesSearch } from './graphql-query';

export interface Response {
  data: Pais[];
}

@Injectable({
  providedIn: 'root',
})
export class PaisSearchGQL extends Query<Response> {
  override document = paisesSearch;
}
