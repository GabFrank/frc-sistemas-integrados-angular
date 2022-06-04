import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteInventarioQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteInventarioGQL extends Mutation<boolean> {
  document = deleteInventarioQuery;
}
