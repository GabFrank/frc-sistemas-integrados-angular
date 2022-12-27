import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FacturaLegal } from '../factura-legal.model';
import { facturaLegalesFullInfoQuery } from './graphql-query';

export interface Response {
  data: FacturaLegal[];
}

@Injectable({
  providedIn: 'root',
})
export class FacturasLegalesFullInfoGQL extends Query<Response> {
  document = facturaLegalesFullInfoQuery;
}
