import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ProductoProveedor } from '../producto-proveedor.model';
import { saveProductoProveedor } from './graphql-query';

export interface SaveProductoProveedorInput {
  productoId?: number;
  proveedorId?: number;
  usuarioId?: number;
}

export interface Response {
  data: ProductoProveedor;
}

@Injectable({
  providedIn: 'root',
})
export class SaveProductoProveedorGQL extends Mutation<Response> {
  document = saveProductoProveedor;
}
