import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Pedido } from '../edit-pedido/pedido.model';
import { savePedidoFull } from './graphql-query';

export interface Response {
  data: Pedido;
}

@Injectable({
  providedIn: 'root',
})
export class SavePedidoFullGQL extends Mutation<Response> {
  document = savePedidoFull;
}
