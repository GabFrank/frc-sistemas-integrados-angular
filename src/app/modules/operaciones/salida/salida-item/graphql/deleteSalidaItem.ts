import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { deleteSalidaQuery } from '../../graphql/graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteSalidaGQL extends Mutation<boolean> {
  document = deleteSalidaQuery;
}
