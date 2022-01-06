import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../../persona/persona.model';
import { Proveedor } from '../../proveedor/proveedor.model';
import { Usuario } from '../../usuarios/usuario.model';
import { Vendedor } from '../vendedor.model';
import { vendedoresSearchByPersona } from './graphql-query';

export interface Response {
  data: Vendedor[];
}


@Injectable({
  providedIn: 'root',
})
export class VendedoresSearchByPersonaGQL extends Query<Response> {
  document = vendedoresSearchByPersona;
}
