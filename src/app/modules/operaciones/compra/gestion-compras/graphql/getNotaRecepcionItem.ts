import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionItemQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetNotaRecepcionItemGQL extends Query<any> {
  document = notaRecepcionItemQuery;
} 