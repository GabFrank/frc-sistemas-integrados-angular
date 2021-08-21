import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { productoInfoCompletaQuery, productoQuery } from './graphql-query';

export interface Response {
  data: Producto;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoInfoCompletaByIdGQL extends Query<Response> {
  document = productoInfoCompletaQuery;
}
