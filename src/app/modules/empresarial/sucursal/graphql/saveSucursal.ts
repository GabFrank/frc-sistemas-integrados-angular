import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Sucursal } from '../sucursal.model';
import { saveSucursal } from './graphql-query';

export interface Response {
  data: Sucursal;
}

@Injectable({
  providedIn: 'root',
})
export class SaveSucursalGQL extends Mutation<Response> {
  document = saveSucursal;
} 