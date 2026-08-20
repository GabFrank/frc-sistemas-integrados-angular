import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { finiquitosPendientesPagoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class FiniquitosPendientesPagoGQL extends Query<Response> {
  document = finiquitosPendientesPagoQuery;
}
