import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FacturaLegal } from '../factura-legal.model';
import { facturaLegalesQuery } from './graphql-query';

export interface Response {
  data: FacturaLegal[];
}

@Injectable({
  providedIn: 'root',
})
export class FacturasLegalesGQL extends Query<Response> {
  document = facturaLegalesQuery;
}
