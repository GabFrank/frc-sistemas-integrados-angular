import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { mergePedidoItemDistribucionesMutation } from './graphql-query';
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
export class MergePedidoItemDistribucionesGQL extends Mutation<Response, Variables> {
  document = mergePedidoItemDistribucionesMutation;
}
