import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { productoPorProveedor } from './graphql-query';

export interface Response {
  productos: Producto[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductoPorProveedorGQL extends Query<Response> {
  document = productoPorProveedor;
}
