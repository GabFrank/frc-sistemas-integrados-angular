import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { removerNotaDeSolicitudPagoMutation } from './graphql-query';

export interface RemoverNotaDeSolicitudPagoVariables {
  solicitudPagoId: number;
  notaRecepcionId: number;
}

export interface RemoverNotaDeSolicitudPagoResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RemoverNotaDeSolicitudPagoGQL extends Mutation<
  RemoverNotaDeSolicitudPagoResponse,
  RemoverNotaDeSolicitudPagoVariables
> {
  document = removerNotaDeSolicitudPagoMutation;
}
