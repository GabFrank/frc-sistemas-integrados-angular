import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoItemSucursal } from '../pedido-item-sucursal.model';
import { pedidoItensSucursalByPedidoItemQuery } from './graphql-query';

export interface Response {
  pedidoItensSucursalByPedidoItem: PedidoItemSucursal[];
}

@Injectable({
  providedIn: 'root',
})
export class GetPedidoItensSucursalByPedidoItemGQL extends Query<Response> {
  document = pedidoItensSucursalByPedidoItemQuery;
} 