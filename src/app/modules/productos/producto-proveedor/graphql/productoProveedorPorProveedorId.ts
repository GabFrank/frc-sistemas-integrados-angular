import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ProductoProveedor } from '../producto-proveedor.model';
import { productoProveedorPorProveedorId } from './graphql-query';


export interface Response {
  data: ProductoProveedor[];
}


@Injectable({
  providedIn: 'root',
})
export class ProductoProveedorPorProveedorIdGQL extends Query<Response> {
  document = productoProveedorPorProveedorId;
}


