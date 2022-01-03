import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Venta } from '../venta.model';
import { ventaQuery } from './graphql-query';

class Response {
  data: Venta
}

@Injectable({
  providedIn: 'root',
})
export class VentaPorIdGQL extends Query<Response> {
  document = ventaQuery;
}
