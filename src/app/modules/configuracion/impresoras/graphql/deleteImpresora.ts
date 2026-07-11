import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteImpresoraQuery } from './graphql-query';

export interface Response {
  deleteImpresora: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteImpresoraGQL extends Mutation<Response> {
  document = deleteImpresoraQuery;
}
