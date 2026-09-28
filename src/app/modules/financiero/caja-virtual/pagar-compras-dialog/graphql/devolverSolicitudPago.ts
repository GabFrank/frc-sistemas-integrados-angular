import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { devolverSolicitudPagoMutation } from './graphql-query';
export interface Response { data: any; }
@Injectable({ providedIn: 'root' })
export class DevolverSolicitudPagoGQL extends Mutation<Response> {
  document = devolverSolicitudPagoMutation;
}
