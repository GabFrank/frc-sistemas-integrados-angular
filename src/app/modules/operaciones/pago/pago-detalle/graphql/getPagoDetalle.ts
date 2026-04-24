import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PagoDetalle } from '../pago-detalle.model';
import { GET_PAGO_DETALLE } from './graphql-query';

export interface PagoDetalleResponse {
  data: PagoDetalle;
}

@Injectable({
  providedIn: 'root'
})
export class GetPagoDetalle extends Query<PagoDetalleResponse> {
  document = GET_PAGO_DETALLE;
} 