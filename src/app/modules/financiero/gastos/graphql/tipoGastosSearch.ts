import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoGasto } from '../models/tipo-gasto.model';
import { tipoGastosSearch } from './graphql-query';

export interface Response {
  data: TipoGasto[];
}


@Injectable({
  providedIn: 'root',
})
export class TipoGastoSearchGQL extends Query<Response> {
  document = tipoGastosSearch;
}
