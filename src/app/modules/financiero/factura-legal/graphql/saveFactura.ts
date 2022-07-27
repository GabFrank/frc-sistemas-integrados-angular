import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { FacturaLegal } from '../factura-legal.model';
import { facturaLegalQuery, saveFacturaLegal } from './graphql-query';

export interface Response {
  data: FacturaLegal;
}

@Injectable({
  providedIn: 'root',
})
export class SaveFacturaLegalGQL extends Mutation<Response> {
  document = saveFacturaLegal;
}
