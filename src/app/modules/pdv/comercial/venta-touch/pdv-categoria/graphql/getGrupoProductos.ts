import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvGruposProductos } from '../../pdv-grupos-productos/pdv-grupos-productos.model';
import { PdvCategoria } from '../pdv-categoria.model';
import { pdvCategoriaQuery, pdvCategoriaSearch, pdvCategoriasQuery, pdvGruposProductosPorGrupoIdQuery } from './graphql-query';


export interface Response {
  data: PdvGruposProductos[];
}


@Injectable({
  providedIn: 'root',
})
export class GruposProductosPorGrupoIdGQL extends Query<Response> {
  document = pdvGruposProductosPorGrupoIdQuery;
}


