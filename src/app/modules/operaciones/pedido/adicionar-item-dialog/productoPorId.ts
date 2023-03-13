import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../../../productos/producto/producto.model';
import { productoPorProveedor, productoQuery, productoUltimasComprasQuery } from './graphql-query';

export interface Response {
  data: Producto;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoPorIdGQL extends Query<Response> {
  document = productoQuery;
}
