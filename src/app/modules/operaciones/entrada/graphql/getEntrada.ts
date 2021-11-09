import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Entrada } from '../entrada.model';
import { entradaQuery, entradasQuery, saveEntrada } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetEntradaGQL extends Query<Entrada> {
  document = entradaQuery;
}
