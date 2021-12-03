import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoGasto } from '../list-tipo-gastos/tipo-gasto.model';
import { tipoGastoQuery } from './graphql-query';

export interface Response {
  monedas: TipoGasto;
}


@Injectable({
  providedIn: 'root',
})
export class TipoGastoPorIdGQL extends Query<Response> {
  document = tipoGastoQuery;
}
