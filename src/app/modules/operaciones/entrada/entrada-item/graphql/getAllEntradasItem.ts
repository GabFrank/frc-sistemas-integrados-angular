import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { EntradaItem } from '../entrada-item.model';
import { entradaItemsQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetAllEntradaItemsGQL extends Query<EntradaItem[]> {
  document = entradaItemsQuery;
}
