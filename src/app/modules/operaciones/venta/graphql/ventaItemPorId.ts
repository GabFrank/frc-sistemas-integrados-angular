import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VentaItem } from '../venta-item.model';
import { ventaItemQuery } from './graphql-query';

class Response {
  data: VentaItem
}

@Injectable({
  providedIn: 'root',
})
export class VentaItemPorIdGQL extends Query<Response> {
  document = ventaItemQuery;
}
