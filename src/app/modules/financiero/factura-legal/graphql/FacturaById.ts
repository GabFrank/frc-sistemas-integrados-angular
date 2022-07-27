import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FacturaLegal } from '../factura-legal.model';
import { facturaLegalQuery } from './graphql-query';

export interface Response {
  data: FacturaLegal;
}

@Injectable({
  providedIn: 'root',
})
export class FacturaLegalByIdGQL extends Query<Response> {
  document = facturaLegalQuery;
}
