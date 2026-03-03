import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { CANCELAR_RECHAZO_MUTATION } from './recepcion-mercaderia-graphql-query';

export interface CancelarRechazoVariables {
  notaRecepcionItemId: number;
  sucursalId: number;
}

export interface CancelarRechazoResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CancelarRechazoGQL extends Mutation<CancelarRechazoResponse, CancelarRechazoVariables> {
  document = CANCELAR_RECHAZO_MUTATION;
} 