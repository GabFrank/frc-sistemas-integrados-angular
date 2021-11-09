import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Salida } from '../salida.model';
import { salidaQuery, salidasQuery, saveSalida } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetSalidaGQL extends Query<Salida> {
  document = salidaQuery;
}
