import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirSolicitudPagoTicketMutation } from './graphql-query';

export interface ImprimirSolicitudPagoTicketVariables {
  solicitudPagoId: number;
  printerName?: string;
}

export interface ImprimirSolicitudPagoTicketResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirSolicitudPagoTicketGQL extends Mutation<
  ImprimirSolicitudPagoTicketResponse,
  ImprimirSolicitudPagoTicketVariables
> {
  document = imprimirSolicitudPagoTicketMutation;
}
