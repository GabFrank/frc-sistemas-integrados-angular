import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCategoria } from '../pdv-categoria.model';
import { pdvCategoriaQuery, pdvCategoriaSearch, pdvCategoriasQuery } from './graphql-query';


export interface Response {
  data: PdvCategoria[];
}


@Injectable({
  providedIn: 'root',
})
export class PdvCategoriaFullInfoGQL extends Query<Response> {
  document = pdvCategoriasQuery;
}


