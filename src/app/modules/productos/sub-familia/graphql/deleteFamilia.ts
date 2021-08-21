import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Subfamilia } from '../sub-familia.model';
import { deleteSubfamiliaQuery } from './graphql-query';

export interface Response {
  data: Subfamilia[];
}


@Injectable({
  providedIn: 'root',
})
export class DeleteSubfamiliaGQL extends Mutation<Response> {
  document = deleteSubfamiliaQuery;
}


