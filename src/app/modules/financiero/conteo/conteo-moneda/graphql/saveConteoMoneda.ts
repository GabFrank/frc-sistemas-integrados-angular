import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { ConteoMoneda } from '../conteo-moneda.model';
import { saveConteoMoneda } from './graphql-query';

export interface Response {
  data: ConteoMoneda;
}

@Injectable({
  providedIn: 'root',
})
export class SaveConteoMonedaGQL extends Mutation<Response> {
  document = saveConteoMoneda;
}
