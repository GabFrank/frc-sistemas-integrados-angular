import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteInventarioProductoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteInventarioProductoGQL extends Mutation<boolean> {
  document = deleteInventarioProductoQuery;
}
