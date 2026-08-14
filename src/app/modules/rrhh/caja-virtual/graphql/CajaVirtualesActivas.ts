import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CajaVirtual } from '../caja-virtual.model';
import { cajaVirtualesActivasQuery } from './graphql-query';

export interface Response {
  data: CajaVirtual[];
}

@Injectable({ providedIn: 'root' })
export class CajaVirtualesActivasGQL extends Query<Response> {
  document = cajaVirtualesActivasQuery;
}
