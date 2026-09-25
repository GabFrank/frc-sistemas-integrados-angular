import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveRegionTerminalPosMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class SaveRegionTerminalPosGQL extends Mutation<any> {
  document = saveRegionTerminalPosMutation;
}
