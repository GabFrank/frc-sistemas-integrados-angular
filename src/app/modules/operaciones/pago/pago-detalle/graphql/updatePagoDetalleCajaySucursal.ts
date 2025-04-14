import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PagoDetalle } from '../pago-detalle.model';
import { UPDATE_PAGO_DETALLE_CAJA_Y_SUCURSAL } from './graphql-query';

export interface UpdatePagoDetalleCajaySucursalResponse {
  data: PagoDetalle;
}

@Injectable({
  providedIn: 'root'
})
export class UpdatePagoDetalleCajaySucursal extends Mutation<UpdatePagoDetalleCajaySucursalResponse> {
  document = UPDATE_PAGO_DETALLE_CAJA_Y_SUCURSAL;
} 