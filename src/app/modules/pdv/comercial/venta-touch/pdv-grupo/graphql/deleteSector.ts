import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteSectorQuery, saveSector } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteSectorGQL extends Mutation<boolean> {
  document = deleteSectorQuery;
}
