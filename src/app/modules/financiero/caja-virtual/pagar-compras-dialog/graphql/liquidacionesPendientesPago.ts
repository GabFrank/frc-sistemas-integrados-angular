import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { liquidacionesPendientesPagoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class LiquidacionesPendientesPagoGQL extends Query<Response> {
  document = liquidacionesPendientesPagoQuery;
}
