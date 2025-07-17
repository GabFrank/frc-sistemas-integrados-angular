import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionItemDistribucionesByNotaRecepcionItemIdQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetNotaRecepcionItemDistribucionesByNotaRecepcionItemIdGQL extends Query<any> {
  document = notaRecepcionItemDistribucionesByNotaRecepcionItemIdQuery;
} 