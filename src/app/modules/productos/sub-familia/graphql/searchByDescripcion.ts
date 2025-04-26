import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Subfamilia } from '../sub-familia.model';
import { findByDescripcionSinFamilia, subfamiliasQuery } from './graphql-query';

export interface Response {
  data: Subfamilia[];
}


@Injectable({
  providedIn: 'root',
})
export class SearchSubfamiliaByDescripcionGQL extends Query<Response> {
  document = findByDescripcionSinFamilia;
}


