import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { productoDescripcionExistsQuery } from './graphql-query';

export interface ProductoDescripcionExistsResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoDescripcionExistsGQL extends Query<ProductoDescripcionExistsResponse> {
  document = productoDescripcionExistsQuery;
}
