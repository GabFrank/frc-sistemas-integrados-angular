import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { agregarNotaASolicitudPagoMutation } from './graphql-query';

export interface AgregarNotaASolicitudPagoVariables {
  solicitudPagoId: number;
  notaRecepcionId: number;
  montoIncluido: number;
}

export interface AgregarNotaASolicitudPagoResponse {
  data: {
    id: number;
    montoIncluido: number;
    creadoEn?: string;
    notaRecepcion?: { id: number; numero: number; fecha?: string; valorTotal?: number; estado?: string };
  };
}

@Injectable({
  providedIn: 'root',
})
export class AgregarNotaASolicitudPagoGQL extends Mutation<
  AgregarNotaASolicitudPagoResponse,
  AgregarNotaASolicitudPagoVariables
> {
  document = agregarNotaASolicitudPagoMutation;
}
