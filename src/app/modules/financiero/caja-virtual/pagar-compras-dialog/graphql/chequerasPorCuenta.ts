import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { chequerasPorCuentaQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ChequerasPorCuentaGQL extends Query<Response> {
  document = chequerasPorCuentaQuery;
}
