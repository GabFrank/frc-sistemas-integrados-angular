import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { MovimientoStock } from '../movimiento-stock.model';
import { findMovimientoStockByFiltersQuery, findStockPorTipoMovimientoQuery, findStockWithFiltersQuery } from './graphql-query';
import { TipoMovimiento } from '../movimiento-stock.enums';

export class StockPorTipoMovimientoDto {
  tipoMovimiento: TipoMovimiento
  stock: number
}

@Injectable({
  providedIn: 'root',
})
export class GetStockPorTipoMovimientoByFiltersGQL extends Query<StockPorTipoMovimientoDto[]> {
  document = findStockPorTipoMovimientoQuery;
}
