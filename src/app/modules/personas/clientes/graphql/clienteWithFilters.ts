import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cliente } from '../cliente.model';
import { clienteConFiltros } from './graphql-query';

export interface Response {
  clientes: Cliente[];
}


@Injectable({
  providedIn: 'root',
})
export class ClientesSearchConFiltrosGQL extends Query<Response> {
  document = clienteConFiltros;
}
