import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionPorPedidoIdQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetNotaRecepcionPorPedidoIdGQL extends Query<any> {
  document = notaRecepcionPorPedidoIdQuery;
} 