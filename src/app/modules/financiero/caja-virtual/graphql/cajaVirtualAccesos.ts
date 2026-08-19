import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cajaVirtualAccesosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CajaVirtualAccesosGQL extends Query<Response> {
  document = cajaVirtualAccesosQuery;
}
