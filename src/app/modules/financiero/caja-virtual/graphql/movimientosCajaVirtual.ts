import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { movimientosCajaVirtualQuery, movimientosCajaVirtualPorFechaQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class MovimientosCajaVirtualGQL extends Query<Response> {
  document = movimientosCajaVirtualQuery;
}

@Injectable({ providedIn: 'root' })
export class MovimientosCajaVirtualPorFechaGQL extends Query<Response> {
  document = movimientosCajaVirtualPorFechaQuery;
}
