import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { verificarDistribucionSucursalesQuery } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VerificarDistribucionSucursalesGQL extends Query<Response> {
  document = verificarDistribucionSucursalesQuery;
} 