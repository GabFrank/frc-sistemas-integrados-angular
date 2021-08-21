import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Proveedor } from '../proveedor.model';
import { proveedorQuery } from './graphql-query';

export interface Response {
  proveedor: Proveedor;
}

@Injectable({
  providedIn: 'root',
})
export class ProveedorByIdGQL extends Query<Response> {
  document = proveedorQuery;
}
