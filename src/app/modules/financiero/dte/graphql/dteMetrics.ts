import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { dteMetricsQuery } from './graphql-query';

export interface DteMetrics {
  total: number;
  pendientes: number;
  generados: number;
  enviados: number;
  aprobados: number;
  rechazados: number;
  cancelados: number;
}

@Injectable({ providedIn: 'root' })
export class DteMetricsGQL extends Query<{ data: DteMetrics }> {
  document = dteMetricsQuery;
}
