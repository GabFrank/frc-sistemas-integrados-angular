import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PagoDetalleCuota } from '../pago-detalle-cuota.model';
import { savePagoDetalleCuota } from './graphql-query';

export interface Response {
  data: PagoDetalleCuota;
}

@Injectable({
  providedIn: 'root',
})
export class SavePagoDetalleCuotaGQL extends Mutation<Response> {
  document = savePagoDetalleCuota;
} 