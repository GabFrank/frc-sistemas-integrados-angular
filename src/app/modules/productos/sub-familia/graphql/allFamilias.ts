import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Subfamilia } from '../sub-familia.model';
import { subfamiliasQuery } from './graphql-query';

export interface Response {
  data: Subfamilia[];
}


@Injectable({
  providedIn: 'root',
})
export class AllSubfamiliasGQL extends Query<Response> {
  document = subfamiliasQuery;
}


