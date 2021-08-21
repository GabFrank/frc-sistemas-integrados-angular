import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { productoPorProveedor, productoStock } from './graphql-query';

export interface Response {
  data: Number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoStockGQL extends Query<Response> {
  document = productoStock;
}
