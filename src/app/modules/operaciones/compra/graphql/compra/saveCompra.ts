import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Compra } from '../../compra.model';
import { saveCompra } from './graphql-query';

export interface Response {
  data: Compra;
}

@Injectable({
  providedIn: 'root',
})
export class SaveCompraGQL extends Mutation<Response> {
  document = saveCompra;
}
