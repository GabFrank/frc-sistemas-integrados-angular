import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { SalidaItem } from '../salida-item.model';
import { saveSalidaItem } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveSalidaItemGQL extends Mutation<SalidaItem> {
  document = saveSalidaItem;
}
