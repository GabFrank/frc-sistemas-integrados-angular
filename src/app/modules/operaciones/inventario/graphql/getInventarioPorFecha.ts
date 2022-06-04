import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { inventarioPorFechaQuery } from '../../inventario/graphql/graphql-query';
import { Inventario } from '../inventario.model';

@Injectable({
  providedIn: 'root',
})
export class GetInventarioPorFechaGQL extends Query<Inventario[]> {
  document = inventarioPorFechaQuery;
}
