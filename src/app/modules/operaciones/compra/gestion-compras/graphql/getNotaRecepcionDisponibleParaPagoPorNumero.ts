import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notaRecepcionDisponibleParaPagoPorNumeroQuery } from './graphql-query';

export interface GetNotaRecepcionDisponibleParaPagoPorNumeroVariables {
  numero: number;
  proveedorId: number;
}

export interface GetNotaRecepcionDisponibleParaPagoPorNumeroResponse {
  data: NotaRecepcion;
}

@Injectable({
  providedIn: 'root',
})
export class GetNotaRecepcionDisponibleParaPagoPorNumeroGQL extends Query<
  GetNotaRecepcionDisponibleParaPagoPorNumeroResponse,
  GetNotaRecepcionDisponibleParaPagoPorNumeroVariables
> {
  document = notaRecepcionDisponibleParaPagoPorNumeroQuery;
}
