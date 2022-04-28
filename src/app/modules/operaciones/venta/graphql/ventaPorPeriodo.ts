import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Venta } from '../venta.model';
import { ventaPorPeriodoQuery } from './graphql-query';

class Response {
  data: Venta[];
}

@Injectable({
  providedIn: 'root',
})
export class VentaPorPeriodoGQL extends Query<Response> {
  document = ventaPorPeriodoQuery;
}
