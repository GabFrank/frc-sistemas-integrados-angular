import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveNotaRecepcionItemDistribucionesMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveNotaRecepcionItemDistribucionesGQL extends Mutation<any> {
  document = saveNotaRecepcionItemDistribucionesMutation;
} 