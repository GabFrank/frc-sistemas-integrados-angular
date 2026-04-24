import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Pedido, PedidoInput } from '../pedido.model';
import { savePedidoFullMutation } from './graphql-query';

export interface SavePedidoFullVariables {
  input: PedidoInput;
  fechaEntregaList?: string[];
  sucursalEntregaList: number[];
  sucursalInfluenciaList: number[];
  usuarioId: number;
}

export interface SavePedidoFullResponse {
  data: Pedido;
}

@Injectable({
  providedIn: 'root',
})
export class SavePedidoFullGQL extends Mutation<SavePedidoFullResponse, SavePedidoFullVariables> {
  document = savePedidoFullMutation;
} 