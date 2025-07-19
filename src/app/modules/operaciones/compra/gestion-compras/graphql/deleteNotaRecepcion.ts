import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteNotaRecepcionMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteNotaRecepcionGQL extends Mutation<any> {
  document = deleteNotaRecepcionMutation;
} 