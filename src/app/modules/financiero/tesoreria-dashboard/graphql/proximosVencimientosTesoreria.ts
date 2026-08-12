import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { proximosVencimientosTesoreriaQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class ProximosVencimientosTesoreriaGQL extends Query<Response> {
  document = proximosVencimientosTesoreriaQuery;
}
