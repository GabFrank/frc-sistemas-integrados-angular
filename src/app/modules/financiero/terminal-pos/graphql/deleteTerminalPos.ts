import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteTerminalPosQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteTerminalPosGQL extends Mutation {
  document = deleteTerminalPosQuery;
}
