import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cuentasBancariasOperablesQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CuentasBancariasOperablesGQL extends Query<Response> {
  document = cuentasBancariasOperablesQuery;
}
