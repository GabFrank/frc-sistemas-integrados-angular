import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReciboMultiplesClientesQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteCobroVentaCreditoMultiplesGQL extends Query<Response> {
  document = imprimirReciboMultiplesClientesQuery;
}

