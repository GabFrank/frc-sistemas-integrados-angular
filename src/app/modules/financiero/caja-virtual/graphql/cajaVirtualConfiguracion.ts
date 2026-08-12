import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cajaVirtualConfiguracionQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CajaVirtualConfiguracionGQL extends Query<Response> {
  document = cajaVirtualConfiguracionQuery;
}
