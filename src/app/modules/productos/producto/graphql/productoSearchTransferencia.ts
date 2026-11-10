import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { productoSearchTransferencia } from './graphql-query';

export interface Response {
  data: Producto[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductoSearchTransferenciaGQL extends Query<Response> {
  document = productoSearchTransferencia;
}
