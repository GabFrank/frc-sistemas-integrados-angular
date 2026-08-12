import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cajaVirtualSaldosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CajaVirtualSaldosGQL extends Query<Response> {
  document = cajaVirtualSaldosQuery;
}
