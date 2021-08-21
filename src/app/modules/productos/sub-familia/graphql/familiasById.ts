import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Subfamilia } from '../sub-familia.model';
import { subfamiliaQuery } from './graphql-query';

export interface Response {
  data: Subfamilia;
}

@Injectable({
  providedIn: 'root',
})
export class SubamiliaByIdGQL extends Query<Response> {
  document = subfamiliaQuery;
}
