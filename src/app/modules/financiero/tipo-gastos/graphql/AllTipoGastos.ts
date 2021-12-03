import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoGasto } from '../list-tipo-gastos/tipo-gasto.model';
import { tipoGastoQuery, tipoGastosQuery } from './graphql-query';

export interface Response {
  data: TipoGasto[];
}

@Injectable({
  providedIn: 'root',
})
export class AllTipoGastosGQL extends Query<Response> {
  document = tipoGastosQuery;
}
