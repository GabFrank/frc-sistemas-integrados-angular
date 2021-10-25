import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { PdvCategoria } from '../pdv-categoria.model';
import { pdvCategoriaQuery, pdvCategoriaSearch, pdvCategoriasQuery, savePdvCategoria } from './graphql-query';


export interface Response {
  data: PdvCategoria;
}


@Injectable({
  providedIn: 'root',
})
export class SavePdvCategoriaGQL extends Mutation<Response> {
  document = savePdvCategoria;
}


