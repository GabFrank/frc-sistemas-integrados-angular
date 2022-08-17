import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FacturaLegal } from '../factura-legal.model';
import { imprimirFacturasPorCajaQuery } from './graphql-query';

export interface Response {
  data: FacturaLegal[];
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirFacturasPorCajaGQL extends Query<Response> {
  document = imprimirFacturasPorCajaQuery;
}
