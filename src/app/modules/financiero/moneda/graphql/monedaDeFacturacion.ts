import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Moneda } from '../moneda.model';
import { monedaDeFacturacionQuery } from './graphql-query';

export interface Response {
  data: Moneda;
}

@Injectable({
  providedIn: 'root',
})
export class MonedaDeFacturacionGQL extends Query<Response> {
  document = monedaDeFacturacionQuery;
}
