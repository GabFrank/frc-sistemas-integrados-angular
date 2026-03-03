import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { replaceNotaRecepcionItemDistribucionesMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class ReplaceNotaRecepcionItemDistribucionesGQL extends Mutation<any> {
  document = replaceNotaRecepcionItemDistribucionesMutation;
} 