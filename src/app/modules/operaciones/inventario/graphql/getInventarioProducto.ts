import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { InventarioProducto } from '../inventario.model';
import { inventarioProductoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetInventarioProductoGQL extends Query<InventarioProducto> {
  document = inventarioProductoQuery;
}

