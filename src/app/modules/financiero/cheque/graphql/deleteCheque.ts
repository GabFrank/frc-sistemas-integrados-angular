import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteCheque } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteChequeGQL extends Mutation<boolean> {
  document = deleteCheque;
} 