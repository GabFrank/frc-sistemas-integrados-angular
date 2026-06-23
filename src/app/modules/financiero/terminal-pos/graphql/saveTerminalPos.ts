import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { TerminalPos } from '../terminal-pos.model';
import { saveTerminalPos } from './graphql-query';

export interface Response {
  data: TerminalPos;
}

@Injectable({
  providedIn: 'root',
})
export class SaveTerminalPosGQL extends Mutation<Response> {
  document = saveTerminalPos;
}
