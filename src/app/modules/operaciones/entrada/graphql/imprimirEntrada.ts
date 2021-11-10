import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Entrada } from '../entrada.model';
import { entradaQuery, entradasQuery, imprimirEntrada, saveEntrada } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class ImprimirEntradaGQL extends Query<boolean> {
  document = imprimirEntrada;
}
