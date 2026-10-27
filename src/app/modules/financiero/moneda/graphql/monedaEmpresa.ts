import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Moneda } from '../moneda.model';
import { monedaEmpresaQuery } from './graphql-query';

export interface Response {
  data: Moneda;
}

@Injectable({
  providedIn: 'root',
})
export class MonedaEmpresaGQL extends Query<Response> {
  document = monedaEmpresaQuery;
}
