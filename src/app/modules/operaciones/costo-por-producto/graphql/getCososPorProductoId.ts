import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CostoPorProducto } from '../costo-por-producto.model';
import { costosPorProductoIdQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetCostosPorProductoIdGQL extends Query<CostoPorProducto[]> {
  document = costosPorProductoIdQuery;
}
