import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Entrada } from '../entrada.model';
import { entradaPorFechaQuery, entradasQuery, saveEntrada } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetEntradaPorFechaGQL extends Query<Entrada[]> {
  document = entradaPorFechaQuery;
}
