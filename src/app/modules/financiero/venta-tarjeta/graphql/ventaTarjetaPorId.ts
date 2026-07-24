import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ventaTarjetaPorIdQuery } from './graphql-query';
import { VentaTarjeta } from '../venta-tarjeta.model';

export interface VentaTarjetaPorIdResponse {
  data: VentaTarjeta;
}

@Injectable({ providedIn: 'root' })
export class VentaTarjetaPorIdGQL extends Query<VentaTarjetaPorIdResponse> {
  document = ventaTarjetaPorIdQuery;
}
