import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteSucursalQuery } from './graphql-query';

export interface Response {
  deleteSucursal: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteSucursalGQL extends Mutation<Response> {
  document = deleteSucursalQuery;
} 