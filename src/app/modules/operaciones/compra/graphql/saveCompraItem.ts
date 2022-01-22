import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { CompraItem } from '../compra-item.model';
import { compraItemPorProductoId, saveCompraItem } from './compra-item/graphql-query';

export interface Response {
  data: CompraItem;
}

@Injectable({
  providedIn: 'root',
})
export class SaveCompraItemGQL extends Mutation<Response> {
  document = saveCompraItem;
}
