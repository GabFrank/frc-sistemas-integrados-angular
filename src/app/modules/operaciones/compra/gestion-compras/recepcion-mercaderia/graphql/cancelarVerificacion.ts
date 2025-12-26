import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { CANCELAR_VERIFICACION_MUTATION } from './recepcion-mercaderia-graphql-query';

export interface CancelarVerificacionVariables {
  notaRecepcionItemId: number;
  sucursalId: number;
}

export interface CancelarVerificacionResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CancelarVerificacionGQL extends Mutation<CancelarVerificacionResponse, CancelarVerificacionVariables> {
  document = CANCELAR_VERIFICACION_MUTATION;
} 