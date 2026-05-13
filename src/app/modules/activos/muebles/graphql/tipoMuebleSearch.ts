import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoMueble } from '../models/tipo-mueble.model';
import { tipoMuebleSearchQuery } from './graphql-query';

export interface Response {
  data: TipoMueble[];
}

@Injectable({
  providedIn: 'root',
})
export class TipoMuebleSearchGQL extends Query<Response> {
  override document = tipoMuebleSearchQuery;
}
