import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Venta } from '../venta.model';
import { saveVenta } from './graphql-query';

class Response {
  data: Venta
}

@Injectable({
  providedIn: 'root',
})
export class SaveVentaGQL extends Mutation<Response> {
  document = saveVenta;
}
