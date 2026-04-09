import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { TipoGasto } from '../models/tipo-gasto.model';
import { deleteTipoGastoQuery } from './graphql-query';

export interface Response {
  data: TipoGasto;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteTipoGastoGQL extends Mutation<boolean> {
  document = deleteTipoGastoQuery;
}
