import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { MonedaBillete } from '../moneda-billetes.model';
import { monedaBilletePorMonedaId } from './graphql-query';

export interface Response {
  data: MonedaBillete[];
}

@Injectable({
  providedIn: 'root',
})
export class MonedaBilletesPorMonedaIdGQL extends Query<Response> {
  document = monedaBilletePorMonedaId;
}
