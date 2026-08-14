import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { buscarStockPorLoteQuery } from './graphql-query';
import { StockLote } from '../lote.model';

export interface BuscarStockPorLoteResponse {
  data: {
    getTotalPages: number;
    getTotalElements: number;
    getNumberOfElements: number;
    isFirst: boolean;
    isLast: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
    getContent: StockLote[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class BuscarStockPorLoteGQL extends Query<BuscarStockPorLoteResponse> {
  document = buscarStockPorLoteQuery;
}
