import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { EnteVinculacion, EnteVinculacionInput } from '../models/ente-vinculacion.model';
import { saveEnteVinculacionMutation } from './graphql-query';

export interface Response {
  data: EnteVinculacion;
}

@Injectable({ providedIn: 'root' })
export class SaveEnteVinculacionGQL extends Mutation<Response> {
  override document = saveEnteVinculacionMutation;
}
