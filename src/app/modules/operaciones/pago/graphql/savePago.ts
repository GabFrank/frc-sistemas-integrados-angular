import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Pago } from '../pago.model';
import { savePago } from './graphql-query';

export interface Response {
  data: Pago;
}

@Injectable({
  providedIn: 'root',
})
export class SavePagoMutation extends Mutation<Response> {
  document = savePago;
} 