import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Retiro } from '../retiro.model';
import { retiroListPorCajaSalidaIdQuery } from './graphql-query';

export interface Response {
  data: Retiro[];
}

@Injectable({
  providedIn: 'root',
})
export class RetiroPorCajaSalidaIdGQL extends Query<Response> {
  document = retiroListPorCajaSalidaIdQuery;
}
