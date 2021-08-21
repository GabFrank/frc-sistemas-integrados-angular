import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../../persona/persona.model';
import { Usuario } from '../../usuarios/usuario.model';
import { Vendedor } from '../../vendedor/graphql/vendedorSearchByPersona';
import { Proveedor } from '../proveedor.model';
import { proveedoresSearchByPersona } from './graphql-query';

export interface Response {
  data: Proveedor[];
}


@Injectable({
  providedIn: 'root',
})
export class ProveedoresSearchByPersonaGQL extends Query<Response> {
  document = proveedoresSearchByPersona;
}
