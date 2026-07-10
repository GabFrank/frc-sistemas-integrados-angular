import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cancelarVentaTarjetaPorVentaIdMutation } from './graphql-query';

export interface CancelarVentaTarjetaResponse {
  data: boolean;
}

@Injectable({ providedIn: 'root' })
export class CancelarVentaTarjetaPorVentaIdGQL extends Mutation<CancelarVentaTarjetaResponse> {
  document = cancelarVentaTarjetaPorVentaIdMutation;
}
