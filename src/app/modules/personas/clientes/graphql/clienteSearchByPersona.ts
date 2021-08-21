import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../../persona/persona.model';
import { Proveedor } from '../../proveedor/proveedor.model';
import { Usuario } from '../../usuarios/usuario.model';
import { Cliente } from '../cliente.model';
import { clientesSearchByPersona } from './graphql-query';

export interface Response {
  clientes: Cliente[];
}


@Injectable({
  providedIn: 'root',
})
export class ClientesSearchByPersonaGQL extends Query<Response> {
  document = clientesSearchByPersona;
}
