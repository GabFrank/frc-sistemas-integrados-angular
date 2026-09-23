import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TerminalPos } from '../terminal-pos.model';
import { terminalesPosFilialQuery } from './graphql-query';

export interface Response {
  data: TerminalPos[];
}

/** `terminalesPos` contra el FILIAL. Ver el comentario de `terminalesPosFilialQuery`. */
@Injectable({
  providedIn: 'root',
})
export class AllTerminalPosFilialGQL extends Query<Response> {
  document = terminalesPosFilialQuery;
}
