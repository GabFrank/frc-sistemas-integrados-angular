import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Compra } from '../../compra.model';
import { deleteCompraQuery, saveCompra } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteCompraGQL extends Mutation<Response> {
  document = deleteCompraQuery;
}
