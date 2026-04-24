import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteNotaRecepcionItemMutation } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class DeleteNotaRecepcionItemGQL extends Mutation<any> {
  document = deleteNotaRecepcionItemMutation;
} 