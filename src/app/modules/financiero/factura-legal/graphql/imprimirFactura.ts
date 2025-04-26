import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FacturaLegal } from '../factura-legal.model';
import { reimprimirFacturaLegalQuery } from './graphql-query';

export interface Response {
  data: FacturaLegal[];
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirFacturaGQL extends Query<boolean> {
  document = reimprimirFacturaLegalQuery;
}
