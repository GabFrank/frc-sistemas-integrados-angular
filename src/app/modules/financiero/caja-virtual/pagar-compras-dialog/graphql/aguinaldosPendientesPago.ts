import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { aguinaldosPendientesPagoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AguinaldosPendientesPagoGQL extends Query<Response> {
  document = aguinaldosPendientesPagoQuery;
}
