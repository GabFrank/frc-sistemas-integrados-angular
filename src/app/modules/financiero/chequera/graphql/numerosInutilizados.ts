import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { numerosInutilizadosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class NumerosInutilizadosGQL extends Query<Response> {
  document = numerosInutilizadosQuery;
}
