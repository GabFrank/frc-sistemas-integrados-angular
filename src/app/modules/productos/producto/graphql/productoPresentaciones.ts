import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { productoPresentacionesQuery } from './graphql-query';

export interface Response {
  data: Producto;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoPresentacionesGQL extends Query<Response> {
  document = productoPresentacionesQuery;
}
