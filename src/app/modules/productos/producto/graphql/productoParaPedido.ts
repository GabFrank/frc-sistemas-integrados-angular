import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { productoParaPedidoQuery, productoQuery } from './graphql-query';

export interface Response {
  data: Producto;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoParaPedidoGQL extends Query<Response> {
  document = productoParaPedidoQuery;
}
