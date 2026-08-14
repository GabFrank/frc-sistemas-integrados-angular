import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { clientesPorLoteQuery } from './graphql-query';
import { ClienteLote } from '../lote.model';

export interface ClientesPorLoteResponse {
  data: {
    getTotalPages: number;
    getTotalElements: number;
    getNumberOfElements: number;
    isFirst: boolean;
    isLast: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    getContent: ClienteLote[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClientesPorLoteGQL extends Query<ClientesPorLoteResponse> {
  document = clientesPorLoteQuery;
}
