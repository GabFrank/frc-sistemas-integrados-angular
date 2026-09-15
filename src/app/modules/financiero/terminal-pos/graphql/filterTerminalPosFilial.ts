import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { filterTerminalPosFilialQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class FilterTerminalPosFilialGQL extends Query {
  document = filterTerminalPosFilialQuery;
}
