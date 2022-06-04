import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteInventarioProductoItemQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteInventarioProductoItemGQL extends Mutation<boolean> {
  document = deleteInventarioProductoItemQuery;
}
