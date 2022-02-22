import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { findByPdvGrupoProductoQuery, productoPorProveedor, productoQuery, productoUltimasComprasQuery } from './graphql-query';

export interface Response {
  data: Producto[];
}

@Injectable({
  providedIn: 'root',
})
export class FindByPdvGrupoProductoIdGQL extends Query<Response> {
  document = findByPdvGrupoProductoQuery;
}
