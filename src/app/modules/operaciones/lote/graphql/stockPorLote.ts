import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { stockPorLoteQuery } from './graphql-query';
import { StockLote } from '../lote.model';

export interface StockPorLoteResponse {
  data: StockLote[];
}

@Injectable({
  providedIn: 'root'
})
export class StockPorLoteGQL extends Query<StockPorLoteResponse> {
  document = stockPorLoteQuery;
}
