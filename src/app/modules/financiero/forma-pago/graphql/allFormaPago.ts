import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FormaPago } from '../forma-pago.model';
import { formasPagoQuery } from './graphql-query';

export interface Response {
  data: FormaPago[];
}

@Injectable({
  providedIn: 'root',
})
export class FormaPagoGetAllGQL extends Query<Response> {
  document = formasPagoQuery;
}
