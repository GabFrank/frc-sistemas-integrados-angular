import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PedidoRecepcionProductoDto } from '../pedido-recepcion-producto-dto.model';
import {
  pedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProductoQuery
} from './graphql-query';

export interface Response {
  data: PedidoRecepcionProductoDto;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProductoGQL extends Query<Response> {
  document = pedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProductoQuery;
}
