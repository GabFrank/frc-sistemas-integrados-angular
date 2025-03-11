import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { pedidoItensSucursalQuery } from './graphql-query';
import { PedidoItemSucursal } from '../pedido-item-sucursal.model';

export interface Response {
  pedidoItensSucursal: PedidoItemSucursal[];
}

@Injectable({
  providedIn: 'root',
})
export class GetPedidoItensSucursalGQL extends Query<Response> {
  document = pedidoItensSucursalQuery;
} 