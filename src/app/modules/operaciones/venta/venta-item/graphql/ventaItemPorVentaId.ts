import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VentaItem } from '../../venta-item.model';
import { ventaItemListPorVentaIdQuery } from './graphql-query';

class Response {
  data: VentaItem[]
}

@Injectable({
  providedIn: 'root',
})
export class VentaItemPorVentaIdGQL extends Query<Response> {
  document = ventaItemListPorVentaIdQuery;
}
