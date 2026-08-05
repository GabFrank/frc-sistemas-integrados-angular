import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { marcarVentasTarjetaNoCompletadasMutation } from './graphql-query';

export interface MarcarVentasTarjetaNoCompletadasResponse {
  data: number;
}

@Injectable({ providedIn: 'root' })
export class MarcarVentasTarjetaNoCompletadasGQL extends Mutation<MarcarVentasTarjetaNoCompletadasResponse> {
  document = marcarVentasTarjetaNoCompletadasMutation;
}
