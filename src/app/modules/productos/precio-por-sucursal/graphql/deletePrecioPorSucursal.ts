import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';
import { deletePrecioPorSucursalQuery, savePrecioPorSucursal } from './graphql-query';

export interface Response {
  data: PrecioPorSucursal;
}


@Injectable({
  providedIn: 'root',
})
export class DeletePrecioPorSucursalGQL extends Mutation{
  document = deletePrecioPorSucursalQuery;
}


