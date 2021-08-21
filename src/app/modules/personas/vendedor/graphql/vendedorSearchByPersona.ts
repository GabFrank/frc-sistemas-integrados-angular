import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../../persona/persona.model';
import { Proveedor } from '../../proveedor/proveedor.model';
import { Usuario } from '../../usuarios/usuario.model';
import { vendedoresSearchByPersona } from './graphql-query';

export interface Vendedor {
  id: number;
  proveedores: Proveedor[];
  persona: Persona;
  observacion: string;
  usuario: Usuario;
  activo: boolean;
  nombrePersona: string;
}
export interface Response {
  vendedores: Vendedor[];
}


@Injectable({
  providedIn: 'root',
})
export class VendedoresSearchByPersonaGQL extends Query<Response> {
  document = vendedoresSearchByPersona;
}
