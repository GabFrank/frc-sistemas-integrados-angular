import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { inventarioPorFechaQuery, inverntarioAbiertoPorSucursalQuery } from './graphql-query';
import { Inventario } from '../inventario.model';

@Injectable({
  providedIn: 'root',
})
export class GetInventarioAbiertoPorSucursalGQL extends Query<Inventario[]> {
  document = inverntarioAbiertoPorSucursalQuery;
}
