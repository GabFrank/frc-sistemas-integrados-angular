import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Proveedor } from '../proveedor.model';
import { proveedorPorPersona } from './graphql-query';

export interface Response {
  data: Proveedor;
}


@Injectable({
  providedIn: 'root',
})
export class ProveedorPorPersonaGQL extends Query<Response> {
  document = proveedorPorPersona;
}
