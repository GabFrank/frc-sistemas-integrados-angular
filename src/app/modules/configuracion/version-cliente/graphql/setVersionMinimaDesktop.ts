import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { setVersionMinimaDesktopMutation } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class SetVersionMinimaDesktopGQL extends Mutation<Response> {
  document = setVersionMinimaDesktopMutation;
}
