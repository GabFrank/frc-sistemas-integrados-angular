import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PagoDetalleCuota } from '../pago-detalle-cuota.model';
import { PageInfo } from '../../../../../app.component';
import { pagoDetalleCuotasFiltradoQuery } from './graphql-query';

export interface ResponseGetPagoDetalleCuotasFiltrado {
  data: {
    data: PageInfo<PagoDetalleCuota>
  };
}

@Injectable({
  providedIn: 'root'
})
export class GetPagoDetalleCuotasFiltradoGQL extends Query<ResponseGetPagoDetalleCuotasFiltrado> {
  document = pagoDetalleCuotasFiltradoQuery;
} 