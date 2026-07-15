import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deletePedidoMutation } from './graphql-query';

export interface DeletePedidoVariables {
  id: number;
}

export interface DeletePedidoResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeletePedidoGQL extends Mutation<DeletePedidoResponse, DeletePedidoVariables> {
  document = deletePedidoMutation;
}
