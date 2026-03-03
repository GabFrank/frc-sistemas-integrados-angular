import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionPorPedidoIdAndNumeroPageQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetNotaRecepcionPorPedidoIdAndNumeroPageGQL extends Query<any> {
  document = notaRecepcionPorPedidoIdAndNumeroPageQuery;
} 