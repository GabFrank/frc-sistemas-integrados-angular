import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { MonedaBillete } from '../moneda-billetes.model';
import { monedaBilletesQuery } from './graphql-query';

export interface Response {
  data: MonedaBillete;
}

@Injectable({
  providedIn: 'root',
})
export class MonedaBilletePorIdGQL extends Query<Response> {
  document = monedaBilletesQuery;
}
