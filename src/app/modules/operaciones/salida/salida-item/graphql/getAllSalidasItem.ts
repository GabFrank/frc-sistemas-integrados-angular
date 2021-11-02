import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { SalidaItem } from '../salida-item.model';
import { salidaItemsQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetAllSalidaItemsGQL extends Query<SalidaItem[]> {
  document = salidaItemsQuery;
}
