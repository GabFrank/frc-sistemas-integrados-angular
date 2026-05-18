import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirPedidoPDFMutation } from './graphql-query';

export interface ImprimirPedidoPDFVariables {
  pedidoId: number;
}

export interface ImprimirPedidoPDFResponse {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirPedidoPDFGQL extends Mutation<ImprimirPedidoPDFResponse, ImprimirPedidoPDFVariables> {
  document = imprimirPedidoPDFMutation;
}
