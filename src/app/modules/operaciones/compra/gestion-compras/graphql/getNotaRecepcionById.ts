import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getNotaRecepcionByIdQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetNotaRecepcionByIdGQL extends Query<any> {
  document = getNotaRecepcionByIdQuery;
} 