import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cuentasBancariasParaDepositoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CuentasBancariasParaDepositoGQL extends Query<Response> {
  document = cuentasBancariasParaDepositoQuery;
}
