import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Venta } from '../venta.model';
import { ventaQuery, ventasPorCajaIdQuery } from './graphql-query';

class Response {
  data: Venta[]
}

@Injectable({
  providedIn: 'root',
})
export class VentaPorCajaIdGQL extends Query<Response> {
  document = ventasPorCajaIdQuery;
}
