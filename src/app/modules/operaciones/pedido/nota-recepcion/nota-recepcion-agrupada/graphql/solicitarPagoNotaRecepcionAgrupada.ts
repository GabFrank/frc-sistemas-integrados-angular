import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SolicitudPago } from '../../../../../../modules/operaciones/solicitud-pago/solicitud-pago.model';
import { solicitarPagoNotaRecepcionAgrupadaMutation } from './graphql-query';

export interface Response {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class SolicitarPagoNotaRecepcionAgrupadaGQL extends Mutation<Response> {
  document = solicitarPagoNotaRecepcionAgrupadaMutation;
} 