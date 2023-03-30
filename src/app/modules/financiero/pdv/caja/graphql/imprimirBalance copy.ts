import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CajaBalance, PdvCaja } from '../caja.model';
import { balancePorCajaIdQuery } from './graphql-query';

export interface Response {
  data: PdvCaja;
}

@Injectable({
  providedIn: 'root',
})
export class BalancePorCajaIdGQL extends Query<CajaBalance> {
  document = balancePorCajaIdQuery;
}
