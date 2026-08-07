import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { stockLotePorSucursalQuery } from './graphql-query';
import { StockLoteSucursal } from '../lote.model';

export interface StockLotePorSucursalResponse {
  data: StockLoteSucursal[];
}

@Injectable({
  providedIn: 'root'
})
export class StockLotePorSucursalGQL extends Query<StockLotePorSucursalResponse> {
  document = stockLotePorSucursalQuery;
}
