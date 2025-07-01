import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirSolicitudPago } from './graphql-query';

export interface ImprimirSolicitudPagoResponse {
  data: string; // Base64 string for PDF or "TICKET_PRINTED" for ticket
}

export interface ImprimirSolicitudPagoVariables {
  solicitudPagoId: number;
  proveedorNombre: string;
  fechaDePago: string;
  formaPago: string;
  nominal?: boolean;
  tipoImpresion: boolean; // true = PDF, false = Ticket
  printerName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirSolicitudPagoMutation extends Mutation<ImprimirSolicitudPagoResponse> {
  document = imprimirSolicitudPago;
} 