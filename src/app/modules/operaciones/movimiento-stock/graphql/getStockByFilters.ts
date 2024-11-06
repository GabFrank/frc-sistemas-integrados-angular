import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { MovimientoStock } from '../movimiento-stock.model';
import { findMovimientoStockByFiltersQuery, findStockWithFiltersQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetStockPorFiltrosGQL extends Query<number> {
  document = findStockWithFiltersQuery;
}
