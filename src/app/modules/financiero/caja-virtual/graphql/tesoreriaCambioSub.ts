import { Injectable } from '@angular/core';
import { Subscription } from 'apollo-angular';
import { tesoreriaCambioSubQuery } from './graphql-query';

/** Va lleno uno de los dos ids; los dos en null es «releer todo» (tras una reconexión). Llegan como string (ID). */
export interface TesoreriaCambio {
  cajaVirtualId: string | number | null;
  cuentaBancariaId: string | number | null;
}

export interface Response {
  data: TesoreriaCambio;
}

@Injectable({ providedIn: 'root' })
export class TesoreriaCambioSubGQL extends Subscription<Response> {
  document = tesoreriaCambioSubQuery;
}
