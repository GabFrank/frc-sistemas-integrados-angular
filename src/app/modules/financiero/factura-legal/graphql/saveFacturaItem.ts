import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { FacturaLegal, FacturaLegalInput, FacturaLegalItem } from '../factura-legal.model';
import { facturaLegalQuery, saveFacturaLegalItem, saveFacturaLegal } from './graphql-query';

export interface Response {
  data: FacturaLegalItem;
}

@Injectable({
  providedIn: 'root',
})
export class SaveFacturaLegalItemGQL extends Mutation<Response> {
  document = saveFacturaLegalItem;
}
