import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { deleteConteoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteConteoGQL extends Mutation<boolean> {
  document = deleteConteoQuery;
}
