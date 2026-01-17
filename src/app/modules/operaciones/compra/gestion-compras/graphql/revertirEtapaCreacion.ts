import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { revertirEtapaCreacionMutation } from './graphql-query';
import { Pedido } from '../pedido.model';

export interface RevertirEtapaCreacionResponse {
  data: Pedido;
}

export interface RevertirEtapaCreacionVariables {
  pedidoId: number;
}

@Injectable({
  providedIn: 'root',
})
export class RevertirEtapaCreacionGQL extends Mutation<RevertirEtapaCreacionResponse, RevertirEtapaCreacionVariables> {
  document = revertirEtapaCreacionMutation;
}
