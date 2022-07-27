import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cliente } from '../cliente.model';
import { clientePorPersonaDocumento } from './graphql-query';

export interface Response {
  clientes: Cliente;
}


@Injectable({
  providedIn: 'root',
})
export class ClientePersonaDocumentoGQL extends Query<Response> {
  document = clientePorPersonaDocumento;
}
