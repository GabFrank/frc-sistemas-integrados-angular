import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Pedido } from '../pedido.model';
import { pedidosWithFiltersQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetPedidosWithFiltersGQL extends Query<{ data: any }> {
  document = pedidosWithFiltersQuery;
}

