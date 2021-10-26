import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FormaPago } from '../forma-pago.model';
import { formaPagoQuery, } from './graphql-query';

export interface Response {
  moneda: FormaPago;
}

@Injectable({
  providedIn: 'root',
})
export class FormaPagoByIdGQL extends Query<Response> {
  document = formaPagoQuery;
}
