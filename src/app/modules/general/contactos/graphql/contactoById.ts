import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cliente } from 'src/app/modules/personas/clientes/cliente.model';
import { clienteQuery } from 'src/app/modules/personas/clientes/graphql/graphql-query';


export interface Response {
  cliente: Cliente;
}

@Injectable({
  providedIn: 'root',
})
export class ClienteByIdGQL extends Query<Response> {
  document = clienteQuery;
}
