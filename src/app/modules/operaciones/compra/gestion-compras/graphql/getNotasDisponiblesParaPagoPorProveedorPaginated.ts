import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notasDisponiblesParaPagoPorProveedorPaginatedQuery } from './graphql-query';

export interface GetNotasDisponiblesParaPagoPorProveedorPaginatedVariables {
  proveedorId: number;
  page?: number;
  size?: number;
  filtroTexto?: string;
}

export interface NotaRecepcionPageResult {
  getTotalPages?: number;
  getTotalElements?: number;
  getNumberOfElements?: number;
  isFirst?: boolean;
  isLast?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
  getContent?: NotaRecepcion[];
}

export interface GetNotasDisponiblesParaPagoPorProveedorPaginatedResponse {
  data: NotaRecepcionPageResult;
}

@Injectable({
  providedIn: 'root',
})
export class GetNotasDisponiblesParaPagoPorProveedorPaginatedGQL extends Query<
  GetNotasDisponiblesParaPagoPorProveedorPaginatedResponse,
  GetNotasDisponiblesParaPagoPorProveedorPaginatedVariables
> {
  document = notasDisponiblesParaPagoPorProveedorPaginatedQuery;
}
