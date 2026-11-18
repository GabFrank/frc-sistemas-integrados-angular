import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reporteTransferenciaItemsRechazadosQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class ReporteTransferenciaItemsRechazadosGQL extends Query<string> {
  document = reporteTransferenciaItemsRechazadosQuery;
}
