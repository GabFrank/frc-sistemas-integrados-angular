import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReciboQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteCobroVentaCreditoGQL extends Query<Response> {
  document = imprimirReciboQuery;
}
