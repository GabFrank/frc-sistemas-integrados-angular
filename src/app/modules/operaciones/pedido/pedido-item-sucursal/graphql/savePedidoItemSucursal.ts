import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { savePedidoItemSucursalMutation } from './graphql-query';
import { PedidoItemSucursal } from '../pedido-item-sucursal.model';

export interface Response {
  savePedidoItemSucursal: PedidoItemSucursal;
}

@Injectable({
  providedIn: 'root',
})
export class SavePedidoItemSucursalGQL extends Mutation<Response> {
  document = savePedidoItemSucursalMutation;
} 