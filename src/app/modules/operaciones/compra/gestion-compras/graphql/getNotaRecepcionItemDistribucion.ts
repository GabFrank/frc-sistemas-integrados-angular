import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionItemDistribucionQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetNotaRecepcionItemDistribucionGQL extends Query<any> {
  document = notaRecepcionItemDistribucionQuery;
} 