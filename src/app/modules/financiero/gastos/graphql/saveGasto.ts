import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Gasto } from '../models/gastos.model';
import { saveGasto } from './graphql-query';

export interface Response {
  data: Gasto;
}

@Injectable({
  providedIn: 'root',
})
export class SaveGastoGQL extends Mutation<Response> {
  document = saveGasto;
}
