import { Injectable } from '@angular/core';
import { Subscription } from 'apollo-angular';
import { transferenciaQrEscaneadoSubQuery } from './graphql-query';

export interface TransferenciaQrEscaneadoUpdate {
  transferenciaId: number;
  sucursalId: number;
}

export interface Response {
  data: TransferenciaQrEscaneadoUpdate;
}

@Injectable({
  providedIn: 'root',
})
export class TransferenciaQrEscaneadoSubGQL extends Subscription<Response> {
  document = transferenciaQrEscaneadoSubQuery;
}
