import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { inventarioPorUsuarioQuery } from './graphql-query';
import { Inventario } from '../inventario.model';

@Injectable({
  providedIn: 'root',
})
export class GetInventarioPorUsuarioGQL extends Query<Inventario[]> {
  document = inventarioPorUsuarioQuery;
}
