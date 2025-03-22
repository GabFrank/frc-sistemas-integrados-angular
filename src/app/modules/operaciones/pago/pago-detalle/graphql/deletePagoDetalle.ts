import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { DELETE_PAGO_DETALLE } from './graphql-query';

export interface DeletePagoDetalleResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeletePagoDetalle extends Mutation<DeletePagoDetalleResponse> {
  document = DELETE_PAGO_DETALLE;
} 