import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import { getSucursalesDisponiblesRecepcionFisicaQuery } from './graphql-query';

export interface GetSucursalesDisponiblesRecepcionFisicaResponse {
  data: any[];
}

@Injectable({
  providedIn: 'root'
})
export class GetSucursalesDisponiblesRecepcionFisicaGQL extends Query<GetSucursalesDisponiblesRecepcionFisicaResponse> {
  document: DocumentNode = getSucursalesDisponiblesRecepcionFisicaQuery;
} 