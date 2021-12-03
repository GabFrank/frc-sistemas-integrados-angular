import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { savePdvCaja } from './graphql-query';

export interface Response {
  data: PdvCaja;
}

@Injectable({
  providedIn: 'root',
})
export class SaveCajaGQL extends Mutation<Response> {
  document = savePdvCaja;
}
