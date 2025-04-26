import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ProductoProveedor } from '../producto-proveedor.model';
import { productoProveedorPorProductoId } from './graphql-query';


export interface Response {
  data: ProductoProveedor[];
}


@Injectable({
  providedIn: 'root',
})
export class ProductoProveedorPorProductoIdGQL extends Query<Response> {
  document = productoProveedorPorProductoId;
}


