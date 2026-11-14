import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cajaVirtualConfiguracionOrdenesQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CajaVirtualConfiguracionOrdenesGQL extends Query<Response> {
  document = cajaVirtualConfiguracionOrdenesQuery;
}
