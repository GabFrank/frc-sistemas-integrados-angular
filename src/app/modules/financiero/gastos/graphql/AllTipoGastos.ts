import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { tipoGastoQuery, tipoGastosQuery } from './graphql-query';
import { TipoGasto } from '../models/tipo-gasto.model';

export interface Response {
  data: TipoGasto[];
}

@Injectable({
  providedIn: 'root',
})
export class AllTipoGastosGQL extends Query<Response> {
  document = tipoGastosQuery;
}
