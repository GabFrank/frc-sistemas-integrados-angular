import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import { NOTAS_RECEPCION_DISPONIBLES_QUERY } from './recepcion-mercaderia-graphql-query';

export interface GetNotasRecepcionDisponiblesResponse {
  notaRecepcionPorPedidoIdAndNumeroPage: any;
}

@Injectable({
  providedIn: 'root'
})
export class GetNotasRecepcionDisponiblesGQL extends Query<GetNotasRecepcionDisponiblesResponse> {
  document: DocumentNode = NOTAS_RECEPCION_DISPONIBLES_QUERY;
} 