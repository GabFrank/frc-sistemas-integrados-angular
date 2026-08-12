import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cajaVirtualResumenBancarioQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CajaVirtualResumenBancarioGQL extends Query<Response> {
  document = cajaVirtualResumenBancarioQuery;
}
