import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Inventario } from '../inventario.model';
import { saveInventario } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveInventarioGQL extends Mutation<Inventario> {
  document = saveInventario;
}
