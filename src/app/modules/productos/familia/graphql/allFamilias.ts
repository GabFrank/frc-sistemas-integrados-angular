import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Familia } from '../familia.model';
import { familiasQuery } from './graphql-query';

export interface Response {
  data: Familia[];
}


@Injectable({
  providedIn: 'root',
})
export class AllFamiliasGQL extends Query<Response> {
  document = familiasQuery;
}


