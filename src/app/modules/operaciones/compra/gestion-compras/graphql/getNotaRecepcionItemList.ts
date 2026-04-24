import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionItemListQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetNotaRecepcionItemListGQL extends Query<any> {
  document = notaRecepcionItemListQuery;
} 