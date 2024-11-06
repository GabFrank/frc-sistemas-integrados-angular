import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CajaBalance, PdvCaja } from '../caja.model';
import { balancePorCajaIAndSucursalIdQuery, balancePorFecha, cajaQuery, cajasPorFecha, cajasQuery } from './graphql-query';

export interface Response {
  data: CajaBalance;
}

@Injectable({
  providedIn: 'root',
})
export class BalancePorCajaIdAndSucursalIdGQL extends Query<Response> {
  document = balancePorCajaIAndSucursalIdQuery;
}
