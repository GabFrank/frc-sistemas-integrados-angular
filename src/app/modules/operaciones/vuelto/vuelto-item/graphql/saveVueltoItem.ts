import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { VueltoItem } from '../vuelto-item.model';
import { saveVueltoItemQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveVueltoItemGQL extends Mutation<VueltoItem> {
  document = saveVueltoItemQuery;
}
