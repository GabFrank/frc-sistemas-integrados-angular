import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Entrada } from '../entrada.model';
import { saveEntrada } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveEntradaGQL extends Mutation<Entrada> {
  document = saveEntrada;
}
