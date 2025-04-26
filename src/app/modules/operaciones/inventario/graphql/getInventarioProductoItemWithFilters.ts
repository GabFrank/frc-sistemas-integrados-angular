import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { inventarioProductoItemWithFilterQuery, inventarioQuery } from './graphql-query';
import { Inventario, InventarioProductoItem } from '../inventario.model';
import { PageInfo } from '../../../../app.component';

class Response {
  data: PageInfo<InventarioProductoItem>
}

@Injectable({
  providedIn: 'root',
})
export class InventarioProductoItemWithFiltersGQL extends Query<Response> {
  document = inventarioProductoItemWithFilterQuery;
}
