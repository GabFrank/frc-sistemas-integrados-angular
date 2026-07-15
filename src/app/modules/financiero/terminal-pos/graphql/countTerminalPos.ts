import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countTerminalPosQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CountTerminalPosGQL extends Query<number> {
  document = countTerminalPosQuery;
}
