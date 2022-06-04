import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { InventarioProductoItem } from '../inventario.model';
import { saveInventarioProductoItem } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveInventarioProductoItemGQL extends Mutation<InventarioProductoItem> {
  document = saveInventarioProductoItem;
}
