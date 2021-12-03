import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { deleteGastoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteGastoGQL extends Mutation<boolean> {
  document = deleteGastoQuery;
}
