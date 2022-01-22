import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CompraItem } from '../compra-item.model';
import { compraItemPorProductoId, compraItemQuery } from './compra-item/graphql-query';

export interface Response {
  compraItens: CompraItem;
}

@Injectable({
  providedIn: 'root',
})
export class CompraItemPorIdGQL extends Query<Response> {
  document = compraItemQuery;
}
