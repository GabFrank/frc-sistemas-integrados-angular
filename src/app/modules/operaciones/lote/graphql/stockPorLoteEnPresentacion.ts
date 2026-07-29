import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { stockPorLoteEnPresentacionQuery } from './graphql-query';
import { StockLotePresentacion } from '../lote.model';

export interface StockPorLoteEnPresentacionResponse {
  data: StockLotePresentacion[];
}

@Injectable({
  providedIn: 'root'
})
export class StockPorLoteEnPresentacionGQL extends Query<StockPorLoteEnPresentacionResponse> {
  document = stockPorLoteEnPresentacionQuery;
}
