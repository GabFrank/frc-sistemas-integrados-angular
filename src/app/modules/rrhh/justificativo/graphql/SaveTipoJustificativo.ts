import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { TipoJustificativo } from '../justificativo.model';
import { saveTipoJustificativoMutation } from './graphql-query';

export interface Response {
  data: TipoJustificativo;
}

@Injectable({ providedIn: 'root' })
export class SaveTipoJustificativoGQL extends Mutation<Response> {
  document = saveTipoJustificativoMutation;
}
