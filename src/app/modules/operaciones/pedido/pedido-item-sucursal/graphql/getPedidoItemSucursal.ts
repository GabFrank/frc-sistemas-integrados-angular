import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { pedidoItemSucursalQuery } from './graphql-query';
import { PedidoItemSucursal } from '../pedido-item-sucursal.model';

export interface Response {
  pedidoItemSucursal: PedidoItemSucursal;
}

@Injectable({
  providedIn: 'root',
})
export class GetPedidoItemSucursalGQL extends Query<Response> {
  document = pedidoItemSucursalQuery;
} 