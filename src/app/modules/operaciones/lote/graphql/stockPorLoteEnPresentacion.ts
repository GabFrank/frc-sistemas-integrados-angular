import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { stockPorLoteEnPresentacionQuery } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { StockLotePresentacion } from '../lote.model';

export interface StockPorLoteEnPresentacionResponse {
  data: PageInfo<StockLotePresentacion>;
}

@Injectable({
  providedIn: 'root'
})
export class StockPorLoteEnPresentacionGQL extends Query<StockPorLoteEnPresentacionResponse> {
  document = stockPorLoteEnPresentacionQuery;
}
