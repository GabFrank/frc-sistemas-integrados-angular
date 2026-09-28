import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteRegionTerminalPosMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class DeleteRegionTerminalPosGQL extends Mutation<any> {
  document = deleteRegionTerminalPosMutation;
}
