import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { qrRetiroPreGastoQuery } from './graphql-query';

export interface QrRetiroPayload {
  codigoQr: string;
  preGastoId: number;
  sucursalId: number;
  qrToken: string;
}

export interface Response {
  data: QrRetiroPayload;
}

@Injectable({ providedIn: 'root' })
export class QrRetiroPreGastoGQL extends Query<Response> {
  document = qrRetiroPreGastoQuery;
}
