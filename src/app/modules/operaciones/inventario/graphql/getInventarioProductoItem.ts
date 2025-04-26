import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { InventarioProductoItem } from '../inventario.model';
import { inventarioProductoItemQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetInventarioProductoItemGQL extends Query<InventarioProductoItem> {
  document = inventarioProductoItemQuery;
}
