import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../../../productos/producto/producto.model';
import { costoCosteoDeProductoQuery } from './graphql-query';

export interface Response {
  data: Producto;
}

@Injectable({
  providedIn: 'root',
})
export class CostoCosteoDeProductoGQL extends Query<Response> {
  document = costoCosteoDeProductoQuery;
}
