import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { completarVentaTarjetaMutation } from './graphql-query';
import { VentaTarjeta } from '../venta-tarjeta.model';

export interface CompletarVentaTarjetaResponse {
  data: VentaTarjeta;
}

@Injectable({ providedIn: 'root' })
export class CompletarVentaTarjetaGQL extends Mutation<CompletarVentaTarjetaResponse> {
  document = completarVentaTarjetaMutation;
}
