import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { eliminarSolicitudPagoDetalleMutation } from './graphql-query';

export interface EliminarSolicitudPagoDetalleVariables {
  id: number;
}

export interface EliminarSolicitudPagoDetalleResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EliminarSolicitudPagoDetalleGQL extends Mutation<
  EliminarSolicitudPagoDetalleResponse,
  EliminarSolicitudPagoDetalleVariables
> {
  document = eliminarSolicitudPagoDetalleMutation;
}
