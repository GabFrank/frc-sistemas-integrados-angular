import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PagoDetalleCuota } from '../pago-detalle-cuota.model';
import { pagoDetalleCuotasPorPagoDetalleIdQuery } from './graphql-query';

export interface Response {
  data: PagoDetalleCuota[];
}

@Injectable({
  providedIn: 'root',
})
export class GetPagoDetalleCuotasPorPagoDetalleIdGQL extends Query<Response> {
  document = pagoDetalleCuotasPorPagoDetalleIdQuery;
} 