import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Vendedor } from '../vendedor.model';
import { vendedoresSearchByPersona, vendedorQuery } from './graphql-query';

export interface Response {
  data: Vendedor;
}

@Injectable({
  providedIn: 'root',
})
export class VendedorByIdGQL extends Query<Response> {
  document = vendedorQuery;
}
