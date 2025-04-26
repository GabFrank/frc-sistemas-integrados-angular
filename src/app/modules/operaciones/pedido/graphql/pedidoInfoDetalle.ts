import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Pedido } from '../edit-pedido/pedido.model';
import { pedidoInfoDetallesQuery } from './graphql-query';

export interface Response {
  data: Pedido;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoInfoDetalleGQL extends Query<Response> {
  document = pedidoInfoDetallesQuery;
}
