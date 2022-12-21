import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteVueltoItemQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteVueltoItemGQL extends Mutation<Boolean> {
  document = deleteVueltoItemQuery;
}
