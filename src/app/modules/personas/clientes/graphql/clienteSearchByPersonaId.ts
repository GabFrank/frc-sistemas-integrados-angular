import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../../persona/persona.model';
import { Proveedor } from '../../proveedor/proveedor.model';
import { Usuario } from '../../usuarios/usuario.model';
import { Cliente } from '../cliente.model';
import { clienteSearchByPersonaId } from './graphql-query';

export interface Response {
  cliente: Cliente;
}


@Injectable({
  providedIn: 'root',
})
export class ClientesSearchByPersonaIdGQL extends Query<Response> {
  document = clienteSearchByPersonaId;
}
