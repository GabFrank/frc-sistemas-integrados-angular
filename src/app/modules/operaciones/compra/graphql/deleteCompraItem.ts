import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { CompraItem } from '../compra-item.model';
import { compraItemPorProductoId, deleteCompraItemQuery, saveCompraItem } from './compra-item/graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteCompraItemGQL extends Mutation<Response> {
  document = deleteCompraItemQuery;
}
