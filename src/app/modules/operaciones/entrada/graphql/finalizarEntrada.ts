import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Entrada } from '../entrada.model';
import { finalizarEntrada, saveEntrada } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class FinalizarEntradaGQL extends Mutation<boolean> {
  document = finalizarEntrada;
}
