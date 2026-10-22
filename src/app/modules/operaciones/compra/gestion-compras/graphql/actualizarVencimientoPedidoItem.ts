import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PedidoItem } from '../pedido-item.model';
import { actualizarVencimientoPedidoItemMutation } from './pedido-item-graphql-query';

export interface ActualizarVencimientoPedidoItemVariables {
  pedidoItemId: number;
  /** "yyyy-MM-dd", o null para dejar el ítem sin vencimiento. */
  vencimiento: string | null;
}

export interface ActualizarVencimientoPedidoItemResponse {
  data: PedidoItem;
}

@Injectable({
  providedIn: 'root',
})
export class ActualizarVencimientoPedidoItemGQL extends Mutation<ActualizarVencimientoPedidoItemResponse, ActualizarVencimientoPedidoItemVariables> {
  document = actualizarVencimientoPedidoItemMutation;
}
