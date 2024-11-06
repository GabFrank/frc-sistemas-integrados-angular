import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajaSimpleQuery } from './graphql-query';

export interface Response {
  data: PdvCaja;
}

@Injectable({
  providedIn: 'root',
})
export class CajaSimplePorIdGQL extends Query<Response> {
  document = cajaSimpleQuery;
}


