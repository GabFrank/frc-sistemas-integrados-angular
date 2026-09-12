import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { configurarTerminalPosQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class ConfigurarTerminalPosGQL extends Mutation {
  document = configurarTerminalPosQuery;
}
