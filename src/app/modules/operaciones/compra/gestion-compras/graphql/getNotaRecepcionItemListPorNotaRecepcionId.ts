import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionItemListPorNotaRecepcionIdQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetNotaRecepcionItemListPorNotaRecepcionIdGQL extends Query<any> {
  document = notaRecepcionItemListPorNotaRecepcionIdQuery;
} 