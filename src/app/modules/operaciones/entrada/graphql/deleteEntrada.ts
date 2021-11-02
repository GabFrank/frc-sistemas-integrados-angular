import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Entrada } from '../entrada.model';
import { deleteEntradaQuery, saveEntrada } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteEntradaGQL extends Mutation<boolean> {
  document = deleteEntradaQuery;
}
