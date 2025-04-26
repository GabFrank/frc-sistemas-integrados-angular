import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvGruposProductos } from '../../pdv-grupos-productos/pdv-grupos-productos.model';
import { pdvGruposProductosPorGrupoIdSimpleQuery } from './graphql-query';


export interface Response {
  data: PdvGruposProductos[];
}


@Injectable({
  providedIn: 'root',
})
export class GruposProductosPorGrupoIdSimpleGQL extends Query<Response> {
  document = pdvGruposProductosPorGrupoIdSimpleQuery;
}


