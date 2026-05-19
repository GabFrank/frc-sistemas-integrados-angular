import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { TipoGasto } from '../models/tipo-gasto.model';
import { saveTipoGasto, tipoGastoQuery } from './graphql-query';

export interface Response {
  data: TipoGasto;
}

@Injectable({
  providedIn: 'root',
})
export class SaveTipoGastoGQL extends Mutation<Response> {
  document = saveTipoGasto;
}
