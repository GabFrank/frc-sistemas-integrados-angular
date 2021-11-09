import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Salida } from '../salida.model';
import { finalizarSalida, saveSalida } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class FinalizarSalidaGQL extends Mutation<boolean> {
  document = finalizarSalida;
}
