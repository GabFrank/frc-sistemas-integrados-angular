import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoGasto } from '../models/tipo-gasto.model';
import { rootTipoGastoQuery, tipoGastoQuery, tipoGastosQuery } from './graphql-query';

export interface Response {
  data: TipoGasto[];
}

@Injectable({
  providedIn: 'root',
})
export class RootTipoGastosGQL extends Query<Response> {
  document = rootTipoGastoQuery;
}
