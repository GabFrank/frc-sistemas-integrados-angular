import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PagoDetalle, PagoDetalleInput } from '../pago-detalle.model';
import { SAVE_PAGO_DETALLE } from './graphql-query';

export interface PagoDetalleResponse {
  data: PagoDetalle;
}

@Injectable({
  providedIn: 'root'
})
export class SavePagoDetalle extends Mutation<PagoDetalleResponse> {
  document = SAVE_PAGO_DETALLE;
} 