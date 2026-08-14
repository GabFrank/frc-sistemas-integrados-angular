import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cajaVirtualesPorTipoQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class CajaVirtualesPorTipoGQL extends Query<Response> {
  document = cajaVirtualesPorTipoQuery;
}
