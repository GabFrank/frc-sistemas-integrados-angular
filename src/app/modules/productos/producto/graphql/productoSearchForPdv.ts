import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { productoPorCodigoQuery, productoSearchPdv} from './graphql-query';

export interface Response {
  data: Producto[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductoForPdvGQL extends Query<Response> {
  document = productoSearchPdv;
}
