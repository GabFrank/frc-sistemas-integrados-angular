import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { searchProductoWithFilters } from './graphql-query';

export interface Response {
  data: Producto[];
}

@Injectable({
  providedIn: 'root',
})
export class SearchProductoWithFiltersGQL extends Query<Response> {
  document = searchProductoWithFilters;
}
