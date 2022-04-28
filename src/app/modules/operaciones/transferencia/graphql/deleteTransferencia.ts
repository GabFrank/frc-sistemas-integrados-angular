import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteTransferenciaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteTransferenciaGQL extends Mutation<boolean> {
  document = deleteTransferenciaQuery;
}
