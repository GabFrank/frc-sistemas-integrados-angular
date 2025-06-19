import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { pedidoItemPorNotaRecepcionQuery } from '../../../graphql/graphql-query';

export interface PedidoItemPorNotaRecepcionResponse {
  data: {
    getTotalPages: number;
    getTotalElements: number;
    getNumberOfElements: number;
    isFirst: boolean;
    isLast: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    getContent: any[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class PedidoItemPorNotaRecepcionGQL extends Query<PedidoItemPorNotaRecepcionResponse> {
  document = pedidoItemPorNotaRecepcionQuery;
} 