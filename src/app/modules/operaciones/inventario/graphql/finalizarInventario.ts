import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Inventario } from '../inventario.model';
import { finalizarInventarioQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class FinalizarInventarioGQL extends Mutation<Inventario> {
  document = finalizarInventarioQuery;
}

