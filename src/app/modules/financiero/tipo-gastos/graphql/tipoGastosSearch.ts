import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoGasto } from '../list-tipo-gastos/tipo-gasto.model';
import { tipoGastoQuery, tipoGastosSearch } from './graphql-query';

export interface Response {
  monedas: TipoGasto;
}


@Injectable({
  providedIn: 'root',
})
export class TipoGastoSearchGQL extends Query<Response> {
  document = tipoGastosSearch;
}
