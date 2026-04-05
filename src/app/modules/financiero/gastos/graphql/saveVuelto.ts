import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Gasto } from '../models/gastos.model';
import { saveVueltoGasto } from './graphql-query';

export interface Response {
  data: Gasto;
}

@Injectable({
  providedIn: 'root',
})
export class SaveVueltoGastoGQL extends Mutation<Response> {
  document = saveVueltoGasto;
}
