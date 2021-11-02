import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Entrada } from '../entrada.model';
import { entradasQuery, saveEntrada } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetAllEntradasGQL extends Query<Entrada[]> {
  document = entradasQuery;
}
