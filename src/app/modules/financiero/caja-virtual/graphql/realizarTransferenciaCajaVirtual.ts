import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { realizarTransferenciaQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class RealizarTransferenciaCajaVirtualGQL extends Mutation<Response> {
  document = realizarTransferenciaQuery;
}
