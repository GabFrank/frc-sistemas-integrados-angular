import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PagoDetalle } from '../pago-detalle.model';
import { PAGO_DETALLES_POR_PAGO_ID } from './graphql-query';

export interface PagoDetallesPorPagoIdResponse {
  data: PagoDetalle[];
}

@Injectable({
  providedIn: 'root',
})
export class PagoDetallesPorPagoIdGQL extends Query<PagoDetallesPorPagoIdResponse> {
  document = PAGO_DETALLES_POR_PAGO_ID;
} 