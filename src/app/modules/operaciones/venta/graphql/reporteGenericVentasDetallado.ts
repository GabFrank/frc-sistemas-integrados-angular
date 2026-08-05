import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { reporteGenericVentasDetalladoQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteGenericVentasDetalladoGQL extends Query<Response> {
  document = reporteGenericVentasDetalladoQuery;
}
