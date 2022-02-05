import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Venta } from '../venta.model';
import { cancelarVentaQuery, reimprimirVentaQuery, saveVenta } from './graphql-query';

class Response {
  data: boolean
}

@Injectable({
  providedIn: 'root',
})
export class ReimprimirVentaGQL extends Mutation<Response> {
  document = reimprimirVentaQuery;
}
