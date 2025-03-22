import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteChequera } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteChequeraGQL extends Mutation<boolean> {
  document = deleteChequera;
} 