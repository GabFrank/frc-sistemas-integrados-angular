import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { lucroPorProductoQuery, productoPorProveedor, productoStock } from './graphql-query';

export interface Response {
  data: String;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteLucroPorProductoGQL extends Query<Response> {
  document = lucroPorProductoQuery;
}
