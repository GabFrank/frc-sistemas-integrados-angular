import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cuentasBancariasQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class CuentasBancariasGQL extends Query<Response> {
  document = cuentasBancariasQuery;
}
