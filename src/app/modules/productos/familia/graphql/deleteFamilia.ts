import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Familia } from '../familia.model';
import { deleteFamiliaQuery, familiasQuery, familiasSearch, saveFamilia } from './graphql-query';

export interface Response {
  data: Familia[];
}


@Injectable({
  providedIn: 'root',
})
export class DeleteFamiliaGQL extends Mutation<Response> {
  document = deleteFamiliaQuery;
}


