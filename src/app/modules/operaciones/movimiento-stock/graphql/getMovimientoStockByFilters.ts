import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { MovimientoStock } from '../movimiento-stock.model';
import { findMovimientoStockByFiltersQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetMovimientoStockPorFiltrosGQL extends Query<PageInfo<MovimientoStock>> {
  document = findMovimientoStockByFiltersQuery;
}
