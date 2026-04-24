import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { RECEPCIONAR_TODO_POR_NOTA_MUTATION } from './recepcion-mercaderia-graphql-query';

export interface RecepcionarTodoPorNotaVariables {
  notaId: number;
  sucursalesIds: number[];
  usuarioId: number;
  itemIds?: number[];
}

export interface RecepcionarTodoPorNotaResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RecepcionarTodoPorNotaGQL extends Mutation<RecepcionarTodoPorNotaResponse, RecepcionarTodoPorNotaVariables> {
  document = RECEPCIONAR_TODO_POR_NOTA_MUTATION;
}
