import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveNotaRecepcionItemDistribucionMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveNotaRecepcionItemDistribucionGQL extends Mutation<any> {
  document = saveNotaRecepcionItemDistribucionMutation;
} 