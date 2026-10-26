import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PedidoItem, PedidoItemInput } from '../pedido-item.model';
import { PedidoItemDistribucionInput } from '../pedido-item-distribucion.model';
import { guardarPedidoItemConDistribucionesMutation } from './pedido-item-graphql-query';

export interface GuardarPedidoItemConDistribucionesVariables {
  pedidoItem: PedidoItemInput;
  distribuciones: PedidoItemDistribucionInput[];
}

@Injectable({
  providedIn: 'root',
})
export class GuardarPedidoItemConDistribucionesGQL extends Mutation<{ data: PedidoItem }, GuardarPedidoItemConDistribucionesVariables> {
  document = guardarPedidoItemConDistribucionesMutation;
}
