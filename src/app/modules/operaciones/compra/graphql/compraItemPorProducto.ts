import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CompraItem } from '../compra-item.model';
import { compraItemPorProductoId } from './compra-item/graphql-query';

export interface Response {
  compraItens: CompraItem[];
}

@Injectable({
  providedIn: 'root',
})
export class CompraItemByIdGQL extends Query<Response> {
  document = compraItemPorProductoId;
}
