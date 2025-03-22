import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Pago } from '../pago.model';
import { pago } from './graphql-query';

export interface Response {
  data: Pago;
}

@Injectable({
  providedIn: 'root',
})
export class PagoQuery extends Query<Response> {
  document = pago;
} 