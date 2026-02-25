import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { agregarSolicitudPagoDetalleMutation } from './graphql-query';
import { SolicitudPagoDetalleInput } from '../solicitud-pago.model';

export interface AgregarSolicitudPagoDetalleVariables {
  solicitudPagoId: number;
  detalle: SolicitudPagoDetalleInput;
}

export interface AgregarSolicitudPagoDetalleResponse {
  data: {
    id: number;
    valor: number;
    fechaPago?: string;
    observacion?: string;
    cotizacion?: number;
    orden?: number;
    fechaEmisionCheque?: string;
    portador?: string;
    nominal?: boolean;
    diferido?: boolean;
    moneda?: { id: number; denominacion: string };
    formaPago?: { id: number; descripcion: string };
  };
}

@Injectable({
  providedIn: 'root',
})
export class AgregarSolicitudPagoDetalleGQL extends Mutation<
  AgregarSolicitudPagoDetalleResponse,
  AgregarSolicitudPagoDetalleVariables
> {
  document = agregarSolicitudPagoDetalleMutation;
}
