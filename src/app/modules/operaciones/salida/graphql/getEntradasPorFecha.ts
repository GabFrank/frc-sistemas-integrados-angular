import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Salida } from '../salida.model';
import { salidaPorFechaQuery, salidasQuery, saveSalida } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetSalidaPorFechaGQL extends Query<Salida[]> {
  document = salidaPorFechaQuery;
}
