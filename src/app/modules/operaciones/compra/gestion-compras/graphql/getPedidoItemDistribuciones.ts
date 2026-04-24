import { Injectable } from '@angular/core';
import { Apollo, Query } from 'apollo-angular';
import { pedidoItemDistribucionesByPedidoItemIdQuery } from './graphql-query';
import { PedidoItemDistribucion } from '../pedido-item-distribucion.model';

interface Response {
  data: PedidoItemDistribucion[];
}

interface Variables {
  pedidoItemId: number;
}

@Injectable({
  providedIn: 'root'
})
export class GetPedidoItemDistribucionesGQL extends Query<Response, Variables> {
  document = pedidoItemDistribucionesByPedidoItemIdQuery;
} 