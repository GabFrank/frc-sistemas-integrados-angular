import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { InventarioProducto } from '../inventario.model';
import { saveInventarioProducto } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveInventarioProductoGQL extends Mutation<InventarioProducto> {
  document = saveInventarioProducto;
}
