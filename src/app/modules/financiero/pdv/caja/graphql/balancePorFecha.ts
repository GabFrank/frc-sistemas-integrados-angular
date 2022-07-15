import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CajaBalance, PdvCaja } from '../caja.model';
import { balancePorFecha, cajaQuery, cajasPorFecha, cajasQuery } from './graphql-query';

export interface Response {
  data: CajaBalance;
}

@Injectable({
  providedIn: 'root',
})
export class BalancePorFechaGQL extends Query<Response> {
  document = balancePorFecha;
}
