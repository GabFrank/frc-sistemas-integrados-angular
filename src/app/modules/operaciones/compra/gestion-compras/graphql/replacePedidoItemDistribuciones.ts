import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { replacePedidoItemDistribucionesMutation } from './graphql-query';
import { PedidoItemDistribucion, PedidoItemDistribucionInput } from '../pedido-item-distribucion.model';

interface Response {
  data: PedidoItemDistribucion[];
}

interface Variables {
  pedidoItemId: number;
  inputs: PedidoItemDistribucionInput[];
}

@Injectable({
  providedIn: 'root'
})
export class ReplacePedidoItemDistribucionesGQL extends Mutation<Response, Variables> {
  document = replacePedidoItemDistribucionesMutation;
}
