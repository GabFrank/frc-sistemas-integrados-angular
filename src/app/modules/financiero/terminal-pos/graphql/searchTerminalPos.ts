import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TerminalPos } from '../terminal-pos.model';
import { searchTerminalPosQuery } from './graphql-query';

export interface Response {
  data: TerminalPos[];
}

@Injectable({
  providedIn: 'root',
})
export class SearchTerminalPosGQL extends Query<Response> {
  document = searchTerminalPosQuery;
}
