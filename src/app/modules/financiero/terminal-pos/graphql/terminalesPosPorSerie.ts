import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { terminalesPosPorSerieQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class TerminalesPosPorSerieGQL extends Query {
  document = terminalesPosPorSerieQuery;
}
