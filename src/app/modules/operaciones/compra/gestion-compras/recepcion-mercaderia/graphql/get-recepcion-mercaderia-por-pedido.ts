import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { Observable } from 'rxjs';
import { RECEPCION_MERCADERIA_POR_PEDIDO_QUERY } from './recepcion-mercaderia-graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetRecepcionMercaderiaPorPedidoGQL {
  constructor(private apollo: Apollo) {}

  watch(pedidoId: number): QueryRef<any> {
    return this.apollo.watchQuery({
      query: RECEPCION_MERCADERIA_POR_PEDIDO_QUERY,
      variables: { pedidoId },
      fetchPolicy: 'cache-and-network'
    });
  }

  fetch(pedidoId: number): Observable<any> {
    return this.apollo.query({
      query: RECEPCION_MERCADERIA_POR_PEDIDO_QUERY,
      variables: { pedidoId },
      fetchPolicy: 'network-only'
    });
  }
} 