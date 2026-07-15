import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ModuloGastoInfo } from '../utils/tipo-gasto-modulo-reglas.util';
import { modulosGastoQuery } from './graphql-query';

export interface Response {
  data: ModuloGastoInfo[];
}

@Injectable({
  providedIn: 'root',
})
export class ModulosGastoGQL extends Query<Response> {
  document = modulosGastoQuery;
}
