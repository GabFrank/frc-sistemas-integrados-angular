import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Gasto } from '../gastos.model';
import { saveGasto } from './graphql-query';

export interface Response {
  gasto: Gasto;
}

@Injectable({
  providedIn: 'root',
})
export class SaveGastoGQL extends Mutation<Response> {
  document = saveGasto;
}
