import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../../../app.component';
import { PedidoRecepcionProductoDto } from '../pedido-recepcion-producto-dto.model';
import {
  pedidoRecepcionProductoPorNotaRecepcionAgrupadaQuery
} from './graphql-query';

export interface Response {
  data: PageInfo<PedidoRecepcionProductoDto>;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoRecepcionProductoPorNotaRecepcionAgrupadaGQL extends Query<Response> {
  document = pedidoRecepcionProductoPorNotaRecepcionAgrupadaQuery;
}
