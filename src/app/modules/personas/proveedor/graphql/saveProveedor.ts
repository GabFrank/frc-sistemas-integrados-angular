import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Proveedor } from '../proveedor.model';
import { saveProveedor } from './graphql-query';

export interface Response {
  proveedor: Proveedor;
}

@Injectable({
  providedIn: 'root',
})
export class SaveProveedorGQL extends Mutation<Response> {
  document = saveProveedor;
}
