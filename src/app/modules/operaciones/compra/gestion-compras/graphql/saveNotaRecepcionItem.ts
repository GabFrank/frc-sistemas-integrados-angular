import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveNotaRecepcionItemMutation } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class SaveNotaRecepcionItemGQL extends Mutation<any> {
  document = saveNotaRecepcionItemMutation;
} 