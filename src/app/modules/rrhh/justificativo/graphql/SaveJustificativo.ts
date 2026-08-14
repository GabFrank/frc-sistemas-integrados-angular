import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Justificativo } from '../justificativo.model';
import { saveJustificativoMutation } from './graphql-query';

export interface Response {
  data: Justificativo;
}

@Injectable({ providedIn: 'root' })
export class SaveJustificativoGQL extends Mutation<Response> {
  document = saveJustificativoMutation;
}
