import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { resumenStockLoteQuery } from './graphql-query';
import { ResumenStockLote } from '../lote.model';

export interface ResumenStockLoteResponse {
  data: ResumenStockLote;
}

@Injectable({
  providedIn: 'root'
})
export class ResumenStockLoteGQL extends Query<ResumenStockLoteResponse> {
  document = resumenStockLoteQuery;
}
