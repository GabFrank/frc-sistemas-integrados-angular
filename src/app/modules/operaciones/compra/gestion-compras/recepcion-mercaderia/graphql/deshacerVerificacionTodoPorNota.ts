import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { DESHACER_VERIFICACION_TODO_POR_NOTA_MUTATION } from './recepcion-mercaderia-graphql-query';

export interface DeshacerVerificacionTodoPorNotaVariables {
  notaId: number;
  sucursalesIds: number[];
  usuarioId: number;
  itemIds?: number[];
}

export interface DeshacerVerificacionTodoPorNotaResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeshacerVerificacionTodoPorNotaGQL extends Mutation<
  DeshacerVerificacionTodoPorNotaResponse,
  DeshacerVerificacionTodoPorNotaVariables
> {
  document = DESHACER_VERIFICACION_TODO_POR_NOTA_MUTATION;
}

