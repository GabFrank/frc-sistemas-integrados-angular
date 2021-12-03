import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { deleteConteoMonedaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteConteoMonedaGQL extends Mutation<boolean> {
  document = deleteConteoMonedaQuery;
}
