import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { InventarioProductoItem } from '../inventario.model';
import { inventarioProductosItemPorInventarioProductoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetInventarioProductosItemPorInventarioProductoGQL extends Query<InventarioProductoItem[]> {
  document = inventarioProductosItemPorInventarioProductoQuery;
}

