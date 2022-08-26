import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cliente } from '../cliente.model';
import { clientePorPersonaIdFromServer } from './graphql-query';

export interface Response {
  clientes: Cliente;
}


@Injectable({
  providedIn: 'root',
})
export class ClientePersonaIdFromServerGQL extends Query<Response> {
  document = clientePorPersonaIdFromServer;
}
