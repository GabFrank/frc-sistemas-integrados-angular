import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { imprimirSolicitudPagoMutation } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImprimirSolicitudPagoGQL extends Mutation<Response> {
  document = imprimirSolicitudPagoMutation;
}
