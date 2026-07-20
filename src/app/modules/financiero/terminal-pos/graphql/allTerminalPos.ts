import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TerminalPos } from '../terminal-pos.model';
import { terminalesPosQuery } from './graphql-query';

export interface Response {
  data: TerminalPos[];
}

@Injectable({
  providedIn: 'root',
})
export class AllTerminalPosGQL extends Query<Response> {
  document = terminalesPosQuery;
}
