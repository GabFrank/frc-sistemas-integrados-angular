import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirPedidoTicketMutation } from './graphql-query';

export interface ImprimirPedidoTicketVariables {
  pedidoId: number;
  printerName?: string;
}

export interface ImprimirPedidoTicketResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirPedidoTicketGQL extends Mutation<ImprimirPedidoTicketResponse, ImprimirPedidoTicketVariables> {
  document = imprimirPedidoTicketMutation;
}
