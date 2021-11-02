import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { deleteEntradaItemQuery, saveEntradaItem } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteEntradaItemGQL extends Mutation<boolean> {
  document = deleteEntradaItemQuery;
}
