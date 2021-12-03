import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { deleteCajaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteCajaGQL extends Mutation<boolean> {
  document = deleteCajaQuery;
}
