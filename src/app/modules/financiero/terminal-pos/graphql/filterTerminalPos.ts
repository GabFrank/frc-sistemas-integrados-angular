import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { TerminalPos } from '../terminal-pos.model';
import { filterTerminalPosQuery } from './graphql-query';

export interface Response {
  data: PageInfo<TerminalPos>;
}

@Injectable({
  providedIn: 'root',
})
export class FilterTerminalPosGQL extends Query<Response> {
  document = filterTerminalPosQuery;
}
