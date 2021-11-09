import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { deleteSalidaQuery } from '../../graphql/graphql-query';
import { deleteSalidaItemQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteSalidaItemGQL extends Mutation<boolean> {
  document = deleteSalidaItemQuery;
}
