import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotaRecepcion } from '../nota-recepcion.model';
import { notasDisponiblesParaPagoQuery } from './graphql-query';

export interface GetNotasDisponiblesParaPagoVariables {
  pedidoId: number;
}

export interface GetNotasDisponiblesParaPagoResponse {
  data: NotaRecepcion[];
}

@Injectable({
  providedIn: 'root',
})
export class GetNotasDisponiblesParaPagoGQL extends Query<GetNotasDisponiblesParaPagoResponse, GetNotasDisponiblesParaPagoVariables> {
  document = notasDisponiblesParaPagoQuery;
}