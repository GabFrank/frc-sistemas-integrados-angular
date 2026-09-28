import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ventaTarjetaCompletaPorIdQuery } from './graphql-query';
import { VentaTarjeta } from '../venta-tarjeta.model';

export interface VentaTarjetaCompletaPorIdResponse {
  data: VentaTarjeta;
}

@Injectable({ providedIn: 'root' })
export class VentaTarjetaCompletaPorIdGQL extends Query<VentaTarjetaCompletaPorIdResponse> {
  document = ventaTarjetaCompletaPorIdQuery;
}
