import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { vendedoresSearchByPersona, vendedorQuery } from './graphql-query';
import { Vendedor } from './vendedorSearchByPersona';

export interface Response {
  vendedor: Vendedor;
}

@Injectable({
  providedIn: 'root',
})
export class VendedorByIdGQL extends Query<Response> {
  document = vendedorQuery;
}
