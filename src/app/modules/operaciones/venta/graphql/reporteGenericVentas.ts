import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reporteGenericVentasQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteGenericVentasGQL extends Query<Response> {
  document = reporteGenericVentasQuery;
}
