import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { desasignarFormatoTerminalPosQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DesasignarFormatoTerminalPosGQL extends Mutation {
  document = desasignarFormatoTerminalPosQuery;
}
