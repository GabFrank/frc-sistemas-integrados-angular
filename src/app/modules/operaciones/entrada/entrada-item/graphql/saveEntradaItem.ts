import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { EntradaItem } from '../entrada-item.model';
import { saveEntradaItem } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveEntradaItemGQL extends Mutation<EntradaItem> {
  document = saveEntradaItem;
}
