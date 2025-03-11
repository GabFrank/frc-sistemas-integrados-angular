import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deletePedidoItemSucursalMutation } from './graphql-query';

export interface Response {
  deletePedidoItemSucursal: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeletePedidoItemSucursalGQL extends Mutation<Response> {
  document = deletePedidoItemSucursalMutation;
} 