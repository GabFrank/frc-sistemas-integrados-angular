import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PagoDetalleCuota } from '../pago-detalle-cuota.model';
import { pagoDetalleCuotaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetPagoDetalleCuotaGQL extends Query<PagoDetalleCuota> {
  document = pagoDetalleCuotaQuery;
} 