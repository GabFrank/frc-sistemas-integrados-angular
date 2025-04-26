import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countPedidoItemSucursalQuery } from './graphql-query';

export interface Response {
  countPedidoItemSucursal: number;
}

@Injectable({
  providedIn: 'root',
})
export class CountPedidoItemSucursalGQL extends Query<Response> {
  document = countPedidoItemSucursalQuery;
} 