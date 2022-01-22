import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { printProductoPorId, productoPorProveedor, productoQuery, productoUltimasComprasQuery } from './graphql-query';

export interface Response {
  data: Producto;
}

@Injectable({
  providedIn: 'root',
})
export class PrintProductoPorIdGQL extends Query<Response> {
  document = printProductoPorId;
}
