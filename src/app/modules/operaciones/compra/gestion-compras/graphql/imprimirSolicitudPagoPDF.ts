import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirSolicitudPagoPDFMutation } from './graphql-query';

export interface ImprimirSolicitudPagoPDFVariables {
  solicitudPagoId: number;
}

export interface ImprimirSolicitudPagoPDFResponse {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirSolicitudPagoPDFGQL extends Mutation<ImprimirSolicitudPagoPDFResponse, ImprimirSolicitudPagoPDFVariables> {
  document = imprimirSolicitudPagoPDFMutation;
} 