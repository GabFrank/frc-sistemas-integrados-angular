import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notasDisponiblesParaPagoPorProveedorQuery } from './graphql-query';

export interface GetNotasDisponiblesParaPagoPorProveedorVariables {
  proveedorId: number;
}

export interface GetNotasDisponiblesParaPagoPorProveedorResponse {
  data: NotaRecepcion[];
}

@Injectable({
  providedIn: 'root',
})
export class GetNotasDisponiblesParaPagoPorProveedorGQL extends Query<
  GetNotasDisponiblesParaPagoPorProveedorResponse,
  GetNotasDisponiblesParaPagoPorProveedorVariables
> {
  document = notasDisponiblesParaPagoPorProveedorQuery;
}
