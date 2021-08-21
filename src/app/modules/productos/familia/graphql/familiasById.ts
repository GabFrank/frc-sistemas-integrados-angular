import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Familia } from '../familia.model';
import { familiaQuery, familiasSearch } from './graphql-query';

export interface Response {
  familia: Familia;
}

@Injectable({
  providedIn: 'root',
})
export class FamiliaByIdGQL extends Query<Response> {
  document = familiaQuery;
}
