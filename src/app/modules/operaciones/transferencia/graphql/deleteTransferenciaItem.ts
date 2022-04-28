import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteTransferenciaItemQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteTransferenciaItemGQL extends Mutation<boolean> {
  document = deleteTransferenciaItemQuery;
}
