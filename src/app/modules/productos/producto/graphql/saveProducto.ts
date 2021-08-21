import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { saveProducto } from './graphql-query';

export interface Response {
  data: Producto;
}

@Injectable({
  providedIn: 'root',
})
export class SaveProductoGQL extends Mutation<Response> {
  document = saveProducto;
}
