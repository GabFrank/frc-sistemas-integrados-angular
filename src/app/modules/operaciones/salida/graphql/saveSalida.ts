import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Salida } from '../salida.model';
import { saveSalida } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveSalidaGQL extends Mutation<Salida> {
  document = saveSalida;
}
