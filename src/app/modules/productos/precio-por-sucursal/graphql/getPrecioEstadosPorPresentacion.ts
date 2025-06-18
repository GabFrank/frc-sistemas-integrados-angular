import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getPromocionesPorPresentacionQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class getPromocionesPorPresentacionGQL extends Query {
  document = getPromocionesPorPresentacionQuery;
} 