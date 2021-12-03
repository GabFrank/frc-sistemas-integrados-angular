import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { TipoGasto } from '../list-tipo-gastos/tipo-gasto.model';
import { saveTipoGasto, tipoGastoQuery } from './graphql-query';

export interface Response {
  tipoGasto: TipoGasto;
}

@Injectable({
  providedIn: 'root',
})
export class SaveTipoGastoGQL extends Mutation<Response> {
  document = saveTipoGasto;
}
